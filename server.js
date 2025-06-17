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
app.use(express.json());

// ✅ Route: Root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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
    const valid = keys.every(k => parsed[k] && parsed[k] !== "xxxxx");

    if (valid) return res.json(parsed);

    // Fallback: Fetch from CoinGecko if GPT fails
    const coingecko = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
    ).then(r => r.json());

    const fallback = {
      BTC: coingecko.bitcoin.usd.toFixed(2),
      ETH: coingecko.ethereum.usd.toFixed(2),
      SOL: coingecko.solana.usd.toFixed(2),
    };

    res.json(fallback);
  } catch (err) {
    console.error("❌ /prices error:", err.message);
    res.status(500).json({ BTC: "Error", ETH: "Error", SOL: "Error" });
  }
});

// ✅ Route: /pulseit
app.get("/pulseit", async (req, res) => {
  try {
    const pulse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a fast-paced crypto analyst with edge. Reply with short alpha-packed bullet points only. No intros, no disclaimers."
        },
        {
          role: "user",
          content: "Pulse the markets"
        }
      ],
      temperature: 0.6,
    });

    res.send(pulse.choices[0].message.content);
  } catch (err) {
    console.error("❌ /pulseit error:", err.message);
    res.status(500).send("PulseIt error");
  }
});

// ✅ Route: /whitepaper
app.get("/whitepaper", (req, res) => {
  const pdfPath = path.join(__dirname, "public", "whitepaper.pdf");
  if (fs.existsSync(pdfPath)) {
    res.sendFile(pdfPath);
  } else {
    res.status(404).send("Whitepaper not found.");
  }
});

// ✅ Route: /blog/:date
app.get("/blog/:date", (req, res) => {
  const blogPath = path.join(__dirname, "public", "blog", `${req.params.date}.html`);
  if (fs.existsSync(blogPath)) {
    res.sendFile(blogPath);
  } else {
    res.status(404).send("Blog post not found.");
  }
});

// ✅ Route: /ask
app.post("/ask", async (req, res) => {
  const question = req.body.question || "";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a macro crypto strategist blending Raoul Pal's liquidity models, Cathie Wood's tech vision, and Michael Saylor's BTC thesis. Give sharp, strategic answers—no fluff."
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.5,
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error("❌ /ask error:", err.message);
    res.status(500).json({ answer: "CrimznBot is recharging..." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ CrimznBot is live @ http://localhost:${PORT}`);
});
