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

async function fetchCryptoPrice(term) {
  const id = aliasMap[term.toLowerCase()] || term.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const price = json[id]?.usd;

    if (price) {
      return `The current price of ${term.toUpperCase()} is $${price.toLocaleString()}`;
    } else {
      return null;
    }
  } catch {
    return null;
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
            "You are CrimznBot — a GPT-4o assistant for a crypto consulting site. When asked about token prices, first check CoinGecko. If unavailable, say so. Otherwise, respond like GPT-4o.",
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
