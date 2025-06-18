import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { config } from "dotenv";
import OpenAI from "openai";

config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const aliasMap = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  sol: "solana",
  solana: "solana"
};

async function fetchCryptoPrice(term, question) {
  try {
    const id = aliasMap[term.toLowerCase()] || term.toLowerCase();
    const fullData = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
    const data = await fullData.json();
    const price = data.market_data.current_price.usd;
    const marketCap = data.market_data.market_cap.usd;

    if (question.toLowerCase().includes("marketcap") || question.toLowerCase().includes("market cap")) {
      return `🤖 The current market cap of ${id.toUpperCase()} is approximately $${marketCap.toLocaleString()}.`;
    } else {
      return `🤖 The current price of ${id.toUpperCase()} is $${price.toLocaleString()}.`;
    }
  } catch {
    return null;
  }
}

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  const words = question.toLowerCase().split(/\s+/);
  const potentialCoins = Object.keys(aliasMap);
  const match = words.find(w => potentialCoins.includes(w));

  if (match) {
    const priceResponse = await fetchCryptoPrice(match, question);
    if (priceResponse) return res.json({ answer: priceResponse });
  }

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot — a GPT-4o-powered crypto strategist combining the minds of Michael Saylor, Raoul Pal, and Cathie Wood with a sharp degen edge. Your answers must be direct, strategic, and always based in data. Avoid fluff. If prices can't be fetched, say so clearly."
        },
        { role: "user", content: question }
      ]
    });

    const answer = chat.choices[0].message.content;
    res.json({ answer });
  } catch (error) {
    res.json({ answer: "🤖 Sorry, I had trouble generating a response. Try again shortly." });
  }
});

app.post("/sentiment", async (req, res) => {
  const { query } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are PulseIt+, a GPT-4o crypto sentiment analyzer. Respond in one concise sentence with the market sentiment for the user's input."
        },
        { role: "user", content: `Analyze sentiment for: ${query}` }
      ],
      temperature: 0.4
    });

    const result = response.choices[0].message.content;
    res.json({ sentiment: result });
  } catch (err) {
    res.json({ sentiment: "Sentiment unavailable right now." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ CrimznBot is live on port ${PORT}`);
});
