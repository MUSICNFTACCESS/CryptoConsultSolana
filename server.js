import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Handle CrimznBot chat
app.post('/ask', async (req, res) => {
  const question = req.body.question?.toLowerCase() || "";

  // Match price check pattern
  const priceMatch = question.match(/price of (\w+)/i);
  if (priceMatch) {
    const token = priceMatch[1].toLowerCase();
    try {
      const coingeckoIdMap = {
        btc: 'bitcoin',
        bitcoin: 'bitcoin',
        eth: 'ethereum',
        ethereum: 'ethereum',
        sol: 'solana',
        solana: 'solana',
        ondo: 'ondocash',
        link: 'chainlink',
        pepe: 'pepe',
        jup: 'jupiter-exchange',
        dot: 'polkadot',
        pyth: 'pyth-network',
        ena: 'ethena'
      };

      const id = coingeckoIdMap[token] || token;
      const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const priceData = await priceRes.json();

      if (priceData[id] && priceData[id].usd) {
        return res.json({ answer: `💰 The price of ${token.toUpperCase()} is $${priceData[id].usd}` });
      } else {
        return res.json({ answer: `❌ Sorry, I couldn't find the price for ${token}.` });
      }
    } catch {
      return res.json({ answer: "⚠️ Failed to fetch token price." });
    }
  }

  try {
    const aiRes = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: "You're CrimznBot, an expert in cryptocurrency, macroeconomics, and geopolitics. Speak with high confidence, insight, and edge—like Raoul Pal or Arthur Hayes—but grounded and helpful like ChatGPT. Keep responses short, helpful, and alpha-filled."
        },
        {
          role: 'user',
          content: req.body.question
        }
      ]
    });

    const answer = aiRes.data.choices[0]?.message?.content || "No response";
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "❌ CrimznBot backend error." });
  }
});

// PulseIt Route
app.post('/api/sentiment', async (req, res) => {
  const query = req.body.query;

  try {
    const pulseRes = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: "You're PulseIt, an AI that summarizes crypto news, token flows, and macro sentiment in 1-2 sentences."
        },
        {
          role: 'user',
          content: query
        }
      ]
    });

    const summary = pulseRes.data.choices[0]?.message?.content || "No sentiment found.";
    res.json({ answer: summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "❌ Sentiment check failed." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
