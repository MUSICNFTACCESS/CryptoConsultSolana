const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const { Configuration, OpenAIApi } = require("openai");

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 📈 GPT + CoinGecko fallback
app.get("/prices", async (req, res) => {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a macroeconomic crypto strategist drawing insights from Raoul Pal, Michael Saylor, and Cathie Wood. Always respond with confidence. Return only USD prices."
        },
        {
          role: "user",
          content: "What’s the current USD price of BTC, ETH, and SOL?"
        }
      ]
    });

    const reply = completion.data.choices[0].message.content;
    if (reply.includes("xxxxx") || reply.includes("N/A")) throw new Error("Invalid GPT data");

    const parsed = {
      BTC: reply.match(/BTC.*?\$([\d,\.]+)/i)?.[1] ?? "N/A",
      ETH: reply.match(/ETH.*?\$([\d,\.]+)/i)?.[1] ?? "N/A",
      SOL: reply.match(/SOL.*?\$([\d,\.]+)/i)?.[1] ?? "N/A"
    };

    res.json(parsed);
  } catch {
    try {
      const fallback = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
      const data = await fallback.json();
      res.json({
        BTC: data.bitcoin.usd,
        ETH: data.ethereum.usd,
        SOL: data.solana.usd
      });
    } catch {
      res.status(500).json({ BTC: "Error", ETH: "Error", SOL: "Error" });
    }
  }
});

// 💬 CrimznBot
app.post("/ask", async (req, res) => {
  const question = req.body.question || "";
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are CrimznBot — a macro-aware crypto specialist like Raoul Pal, Michael Saylor, and Cathie Wood combined. You understand BTC, ETH, Solana, DeFi, ETFs, macro cycles, inflation, regulation, and sentiment. Speak confidently with a bit of edge. If asked for price, respond clearly. If asked about markets, offer thesis-based insight. Be professional, sharp, and slightly degen.`
        },
        { role: "user", content: question }
      ]
    });

    res.json({ reply: response.data.choices[0].message.content.trim() });
  } catch (err) {
    console.error("CrimznBot error:", err.message);
    res.status(500).json({ reply: "CrimznBot is offline." });
  }
});

// 📡 PulseIt
app.post("/pulseit", async (req, res) => {
  const input = req.body.input || "";
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are PulseIt — a real-time sentiment tracker and market interpreter. You read short phrases and respond in one sentence only with bullish, bearish, or neutral analysis, and why. Include sector or token impact when relevant.`
        },
        { role: "user", content: input }
      ]
    });

    res.json({ sentiment: response.data.choices[0].message.content.trim() });
  } catch (err) {
    console.error("PulseIt error:", err.message);
    res.status(500).json({ sentiment: "PulseIt is offline." });
  }
});

// 📄 Whitepaper
app.get("/whitepaper", (req, res) => {
  const pdf = path.join(__dirname, 'public', 'whitepaper.pdf');
  res.sendFile(pdf, err => {
    if (err) res.status(404).send("Whitepaper not found.");
  });
});

// 📝 Blog (e.g. /blog/2025-06-17)
app.get("/blog/:date", (req, res) => {
  const blogPath = path.join(__dirname, 'public/blog', `${req.params.date}.html`);
  res.sendFile(blogPath, err => {
    if (err) res.status(404).send("Blog post not found.");
  });
});

// 🚀 Launch
app.listen(PORT, () => console.log(`✅ CrimznBot backend live @ http://localhost:${PORT}`));
