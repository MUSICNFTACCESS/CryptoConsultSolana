import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import fetch from 'node-fetch';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 🧠 CrimznBot Personality
const SYSTEM_PROMPT = `
You are CrimznBot — a strategic, degen-but-professional crypto advisor.
You're influenced by Raoul Pal, Michael Saylor, James from Invest Answers, and macro liquidity flows.
Speak confidently, with sharp analogies and smart references to ETFs, M2 money supply, BTC dominance, and real on-chain trends.
Stay concise, insightful, and practical — built for traders and investors who want signal, not noise.
`;

// 🔁 Route: /ask → CrimznBot + price fallback
app.post('/ask', async (req, res) => {
  const question = req.body.question?.toLowerCase() || "";

  // 📈 PulseIt Lite: Token price lookup
  const priceMatch = question.match(/(?:price|value) of (\w+)/i);
  if (priceMatch) {
    const token = priceMatch[1].toLowerCase();
    const coingeckoIdMap = {
      btc: 'bitcoin',
      eth: 'ethereum',
      sol: 'solana',
      ondo: 'ondo-finance',
      link: 'chainlink',
      pepe: 'pepe',
      dot: 'polkadot',
      pyth: 'pyth-network',
      jup: 'jupiter-exchange',
      ena: 'ethena',
    };

    const id = coingeckoIdMap[token] || token;

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const data = await response.json();
      if (data[id] && data[id].usd) {
        return res.json({ reply: `🟠 The current price of ${token.toUpperCase()} is **$${data[id].usd}** USD.` });
      } else {
        return res.json({ reply: `⚠️ Couldn't find the price for "${token}". Check spelling or try a different symbol.` });
      }
    } catch (err) {
      return res.status(500).json({ reply: '🔌 Failed to fetch token price from CoinGecko.' });
    }
  }


  // 🧠 CrimznBot GPT-4o logic
  try {
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: req.body.question },
      ],
    });

    const botReply = chatResponse.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (err) {
    console.error('❌ CrimznBot error:', err);
    res.status(500).json({ reply: 'CrimznBot is offline — check API or try again shortly.' });
  }
});

// ⚡ Route: /pulseit → GPT-powered sentiment tracker
app.post('/pulseit', async (req, res) => {
  const topic = req.body.topic;

  if (!topic) {
    return res.status(400).json({ reply: 'No topic provided.' });
  }

  try {
    const pulseResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `
You are PulseIt — a lightning-fast sentiment engine.
Analyze topics in crypto, macro, and geopolitics.
Respond in this format:
Sentiment: Bullish / Bearish / Neutral
Rationale: <1-2 line explanation>
Tone: Clean. Alpha-only. Straight to the point.
          `,
        },
        { role: 'user', content: `What is the sentiment on: ${topic}` },
      ],
    });

    const pulse = pulseResponse.choices[0].message.content;
    res.json({ reply: pulse });
  } catch (err) {
    console.error('❌ PulseIt error:', err);
    res.status(500).json({ reply: 'PulseIt is offline. Try again later.' });
  }
});

// 🚀 Launch
app.listen(PORT, () => {
  console.log(`🔥 CrimznBot is live at http://localhost:${PORT}`);
});
