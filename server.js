import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Configuration, OpenAIApi } from 'openai';
import fetch from 'node-fetch';

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
        return res.json({ answer: `❌ Sorry, I couldn't find the price for ${token.toUpperCase()}.` });
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
          content: "You're CrimznBot, an expert in cryptocurrency, macroeconomics, technical analysis, and geopolitics. Respond like Raoul Pal with deep insights and real-time relevance."
        },
        {
          role: 'user',
          content: req.body.question
        }
      ]
    });

    const botReply = aiRes.data.choices[0].message.content;
    return res.json({ answer: botReply });
  } catch (error) {
    console.error("OpenAI error:", error);
    return res.json({ answer: "❌ CrimznBot failed to respond." });
  }
});

// Handle Market Sentiment PulseIt
app.post('/api/sentiment', async (req, res) => {
  const query = req.body.query || "";
  try {
    const aiRes = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: "You are PulseIt, a crypto market sentiment analyzer. Summarize the current sentiment from social and macro signals."
        },
        {
          role: 'user',
          content: `Analyze sentiment: ${query}`
        }
      ]
    });

    const pulse = aiRes.data.choices[0].message.content;
    return res.json({ answer: pulse });
  } catch (error) {
    console.error("Sentiment error:", error);
    return res.status(500).json({ answer: "❌ PulseIt failed to analyze sentiment." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});






