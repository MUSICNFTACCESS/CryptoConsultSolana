import express from "express";
import OpenAI from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
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

// ✅ Route: Root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Route: /chat (CrimznBot backend)
app.get("/chat", async (req, res) => {
  try {
    const { message } = req.query;
    if (!message) return res.status(400).json({ error: "Missing message" });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot, a macroeconomic strategist combining insights from Raoul Pal, Michael Saylor, and Cathie Wood. Respond in a clear, strategic, crypto-native tone. If asked about prices, ETF flows, altcoin setups, or market macro, provide concise, useful context. Keep answers short, informative, and grounded in recent developments."
        },
        { role: "user", content: message },
      ],
      temperature: 0.5,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("❌ /chat error:", err.message);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

// ✅ Route: /prices -> Hybrid GPT-4o + CoinGecko fallback
app.get("/prices", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot, a macroeconomic crypto strategist drawing from experts like Raoul Pal, Michael Saylor, and Cathie Wood. Always respond ONLY with live USD prices for BTC, ETH, and SOL in this exact JSON format: { \"BTC\": \"xxxxx.xx\", \"ETH\": \"xxxxx.xx\", \"SOL\": \"xxxxx.xx\" }. No extra text, no markdown."
        },
        {
          role: "user",
          content: "What's the current USD price of BTC, ETH, and SOL?"
        }
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;
    console.log("🧠 GPT-4o Raw:", raw);

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    const jsonString = raw.slice(start, end);
    const parsed = JSON.parse(jsonString);

    const keys = ["BTC", "ETH", "SOL"];
    const valid = keys.every(k => parsed[k] && !parsed[k].includes("xxxxx"));

    if (valid) return res.json(parsed);

    throw new Error("GPT returned placeholder values, falling back...");
  } catch (err) {
    console.warn("⚠️ GPT failed, using CoinGecko fallback:", err.message);
    try {
      const cg = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
      ).then(res => res.json());

      const fallback = {
        BTC: cg.bitcoin.usd.toFixed(2),
        ETH: cg.ethereum.usd.toFixed(2),
        SOL: cg.solana.usd.toFixed(2),
      };
      return res.json(fallback);
    } catch (fallbackErr) {
      console.error("❌ CoinGecko fallback failed:", fallbackErr.message);
      return res.status(500).json({ BTC: "Error", ETH: "Error", SOL: "Error" });
    }
  }
});

// ✅ Route: /pulseIt.json
app.get("/pulseIt.json", (req, res) => {
  const filePath = path.join(__dirname, "public", "pulseIt.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read PulseIt" });
    try {
      const parsed = JSON.parse(data);
      res.json(parsed);
    } catch (parseErr) {
      res.status(500).json({ error: "Invalid PulseIt JSON" });
    }
  });
});

// ✅ Route: /whitepaper
app.get("/whitepaper", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "whitepaper.html"));
});

// ✅ Route: /blog/:date
app.get("/blog/:date", (req, res) => {
  const { date } = req.params;
  const blogPath = path.join(__dirname, "public", "blog", `${date}.html`);
  fs.access(blogPath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).send("Blog not found");
    res.sendFile(blogPath);
  });
});

app.listen(PORT, () => {
  console.log(`✅ CrimznBot is live @ http://localhost:${PORT}`);
});
