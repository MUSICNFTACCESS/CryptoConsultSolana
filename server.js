import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";
import fetch from "node-fetch";

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const aliasMap = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  pepe: "pepe",
  link: "chainlink",
  jup: "jupiter-exchange",
  ondo: "ondo-finance",
  pyth: "pyth-network",
};

async function fetchCryptoPrice(term, question) {
  const aliasMap = {
    btc: "bitcoin",
    eth: "ethereum",
    sol: "solana"
  };

  const id = aliasMap[term.toLowerCase()] || term.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/coins/${id}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const price = data.market_data.current_price.usd;
    const marketCap = data.market_data.market_cap.usd;

    // Smart response logic
    if (question.toLowerCase().includes("marketcap") || question.toLowerCase().includes("market cap")) {
      return `🤖 The current market cap of ${id.toUpperCase()} is approximately $${marketCap.toLocaleString()}.`;
    } else {
      return `🤖 The current price of ${id.toUpperCase()} is $${price.toLocaleString()}.`;
    }
  } catch (error) {
    return `🤖 Sorry, I couldn't fetch the price for ${term.toUpperCase()} at the moment.`;
  }
}

app.post("/ask", async (req, res) => {
  const question = req.body.question || "";
  const lower = question.toLowerCase();

  const match = lower.match(/\b(btc|eth|sol|pepe|link|jup|ondo|pyth)\b/);
  if (match) {
    const livePrice = await fetchCryptoPrice(match[1]);
    if (livePrice) {
      return res.json({ answer: livePrice });
    }
  }

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot — a GPT-4o crypto strategist combining the minds of Michael Saylor, Raoul Pal, and Cathie Wood with a sharp macroeconomic edge and a degen twist. Be concise, confident, and data-driven. Always check CoinGecko for token prices and say if unavailable. Avoid fluff. Think like a consultant, respond like a market tactician."
        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.6,
    });

    const response = chat.choices[0].message.content;
    res.json({ answer: response });
  } catch (err) {
    console.error(err);
    res.json({
      answer:
        "I'm having trouble answering that right now. Please try again shortly.",
    });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("✅ CrimznBot is live on port 3000")
);

app.post("/sentiment", async (req, res) => {
  const query = req.body.query || "";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are PulseIt+, a GPT-4o-powered sentiment tracker trained to analyze crypto-related sentiment across social and macro trends. Your tone is sharp, like a market sniper. Summarize the sentiment clearly in one line, with no fluff. Always answer in the voice of a strategist with degen instincts and macro insight."
        },
        { role: "user", content: `Analyze sentiment for: ${query}` },
      ],
      temperature: 0.4,
    });

    const result = response.choices[0].message.content;
    res.json({ sentiment: result });
  } catch (err) {
    console.error(err);
    res.json({ sentiment: "🚫 PulseIt+ is temporarily offline." });
  }
});
