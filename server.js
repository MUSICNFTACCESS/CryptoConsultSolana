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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // Fallback: CoinGecko
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

// ✅ Route: /pulseit -> Daily market sentiment
app.get("/pulseit", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot. Give a quick 2-sentence PulseIt update with the latest crypto macro sentiment. Include any hot ETF news, BTC trend shifts, or key market inflows. Do not include disclaimers. Style is sharp, Crimzn-branded, slightly degen, always insightful."
        },
        {
          role: "user",
          content: "Give today’s PulseIt."
        }
      ],
      temperature: 0.5,
    });

    const pulse = completion.choices[0].message.content;
    console.log("📣 PulseIt:", pulse);
    res.send(`<pre>${pulse}</pre>`);
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).send("PulseIt temporarily unavailable.");
  }
});

// ✅ Route: /bot -> CrimznBot Q&A
app.post("/bot", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot, a no-BS GPT-4o crypto consultant. You answer like a strategist who blends real-time price data, crypto news, and degen energy with professionalism. Keep responses tight, accurate, and styled with Crimzn’s voice. No disclaimers."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.5,
    });

    const botReply = completion.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (err) {
    console.error("❌ Bot error:", err.message);
    res.status(500).json({ reply: "CrimznBot is down — try again soon." });
  }
});

// ✅ Route: /whitepaper
app.get("/whitepaper", (req, res) => {
  const pdfPath = path.join(__dirname, "public", "whitepaper.pdf");
  fs.access(pdfPath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).send("Whitepaper not found.");
    res.sendFile(pdfPath);
  });
});

// ✅ Route: /blog/:date
app.get("/blog/:date", (req, res) => {
  const filePath = path.join(__dirname, "public", "blog", `${req.params.date}.html`);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).send("Blog post not found.");
    res.sendFile(filePath);
  });
});

app.listen(PORT, () => {
  console.log(`✅ CrimznBot is live @ http://localhost:${PORT}`);
});
