import express from "express";
import OpenAI from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ✅ Route: Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Route: /prices (Hybrid GPT-4o + fallback)
app.get("/prices", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are CrimznBot — an elite crypto-native AI trained on real-time price data and macroeconomic insights from experts like Raoul Pal, Michael Saylor, and Cathie Wood.

Respond ONLY with real-time USD prices in this exact JSON format:
{ "BTC": "xxxxx.xx", "ETH": "xxxxx.xx", "SOL": "xxxxx.xx" }

NO markdown, NO extra commentary, just raw JSON.`
        },
        {
          role: "user",
          content: "What’s the current USD price of BTC, ETH, and SOL?"
        }
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    const json = raw.slice(start, end);
    const parsed = JSON.parse(json);

    const valid = ["BTC", "ETH", "SOL"].every(k => parsed[k] && parsed[k] !== "xxxxx");
    if (!valid) throw new Error("GPT-4o returned placeholder or invalid format");

    res.json(parsed);
  } catch (err) {
    console.error("❌ GPT-4o failed, falling back:", err.message);

    try {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
      const data = await r.json();
      res.json({
        BTC: data.bitcoin.usd.toString(),
        ETH: data.ethereum.usd.toString(),
        SOL: data.solana.usd.toString(),
      });
    } catch (fallbackErr) {
      console.error("❌ CoinGecko fallback failed:", fallbackErr.message);
      res.status(500).json({ BTC: "Error", ETH: "Error", SOL: "Error" });
    }
  }
});

// ✅ Route: /ask (CrimznBot Q&A)
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "No question provided." });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are CrimznBot — a GPT-4o AI trained in crypto, DeFi, tokenomics, macro trends, and investor psychology.

You answer like a strategist with deep insights from Raoul Pal, Michael Saylor, and Cathie Wood. Always give price-aware, smart, fast responses. Do NOT say you're an AI. Respond like a human expert in crypto.

No disclaimers, just guidance — serious tone with a hint of degen when appropriate.`
        },
        {
          role: "user",
          content: question,
        }
      ],
      temperature: 0.6,
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error("❌ CrimznBot GPT-4o error:", err.message);
    res.status(500).json({ answer: "Something went wrong. Try again later." });
  }
});

// ✅ Route: /pulseIt (Logs custom input — future on-chain feature)
app.post("/pulseIt", async (req, res) => {
  const { msg } = req.body;
  if (!msg) return res.status(400).json({ error: "No message sent." });

  console.log(`📡 PulseIt: ${msg}`);
  res.json({ status: "Received" });
});

// ✅ Route: /whitepaper
app.get("/whitepaper", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "whitepaper.pdf"));
});

// ✅ Route: /blog/:date (static HTML per post)
app.get("/blog/:date", (req, res) => {
  const blogFile = `${req.params.date}.html`;
  res.sendFile(path.join(__dirname, "public", "blog", blogFile));
});

// ✅ Server live
app.listen(PORT, () => {
  console.log(`✅ CrimznBot is live @ http://localhost:${PORT}`);
});
