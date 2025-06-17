import express from "express";
import OpenAI from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ✅ Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Hybrid GPT + CoinGecko fallback /prices route
app.get("/prices", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a macroeconomic crypto strategist drawing insights from Raoul Pal, Michael Saylor, and Cathie Wood. Always respond ONLY with live USD prices for BTC, ETH, and SOL in this exact JSON format: { \"BTC\": \"xxxxx.xx\", \"ETH\": \"xxxxx.xx\", \"SOL\": \"xxxxx.xx\" }. No extra text, no markdown."
        },
        {
          role: "user",
          content: "What's the current USD price of BTC, ETH, and SOL?"
        }
      ],
      temperature: 0.3
    });

    const raw = completion.choices[0].message.content;
    console.log("🧠 GPT-4o Raw:", raw);

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    const jsonString = raw.slice(start, end);
    const parsed = JSON.parse(jsonString);

    const valid = ["BTC", "ETH", "SOL"].every(
      k => /^\d+(\.\d+)?$/.test(parsed[k])
    );

    if (valid) return res.json(parsed);

    throw new Error("Invalid GPT data, triggering CoinGecko fallback.");
  } catch (e) {
    console.warn("⚠️ GPT failed or placeholder detected, using CoinGecko...");
    try {
      const data = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd").then(res => res.json());
      const fallback = {
        BTC: data.bitcoin.usd.toFixed(2),
        ETH: data.ethereum.usd.toFixed(2),
        SOL: data.solana.usd.toFixed(2),
      };
      res.json(fallback);
    } catch (err) {
      console.error("❌ CoinGecko Fallback Failed:", err.message);
      res.status(500).json({ BTC: "Error", ETH: "Error", SOL: "Error" });
    }
  }
});

// ✅ /pulseit route
app.get("/pulseit", async (req, res) => {
  try {
    const pulse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are PulseIt, a rapid-fire market sentiment bot. Give a short bold summary of the crypto market sentiment in under 30 words."
        },
        {
          role: "user",
          content: "What’s the current pulse of the crypto market?"
        }
      ],
      temperature: 0.7
    });

    const pulseMsg = pulse.choices[0].message.content;
    res.send(`<h2 style="font-family:monospace;color:#f7931a;">📣 PulseIt:</h2><p>${pulseMsg}</p>`);
  } catch (err) {
    res.status(500).send("PulseIt is offline.");
  }
});

// ✅ /whitepaper route
app.get("/whitepaper", (req, res) => {
  const whitepaperPath = path.join(__dirname, "public", "whitepaper.pdf");
  if (fs.existsSync(whitepaperPath)) {
    res.sendFile(whitepaperPath);
  } else {
    res.status(404).send("Whitepaper not found.");
  }
});

// ✅ /blog route
app.get("/blog/:date", (req, res) => {
  const blogFile = path.join(__dirname, "public", "blog", `${req.params.date}.html`);
  if (fs.existsSync(blogFile)) {
    res.sendFile(blogFile);
  } else {
    res.status(404).send("Blog post not found.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ CrimznBot is live @ http://localhost:${PORT}`);
});
