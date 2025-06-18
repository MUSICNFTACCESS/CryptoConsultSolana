const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 📈 GPT + CoinGecko fallback prices route
app.get('/prices', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are CrimznBot, a macroeconomic crypto strategist drawing insights from Raoul Pal, Michael Saylor, and Cathie Wood. Always respond like a bold market thinker.'
        },
        {
          role: 'user',
          content: "What's the current USD price of BTC, ETH, and SOL?"
        }
      ],
      temperature: 0.3
    });

    const answer = completion.choices[0].message.content;
    console.log("🧠 GPT-4o Answer:", answer);

    // Try parsing out numbers (basic fallback parsing)
    const btc = parseFloat(answer.match(/BTC.*?\$?([\d,\.]+)/i)?.[1].replace(/,/g, '') || '0');
    const eth = parseFloat(answer.match(/ETH.*?\$?([\d,\.]+)/i)?.[1].replace(/,/g, '') || '0');
    const sol = parseFloat(answer.match(/SOL.*?\$?([\d,\.]+)/i)?.[1].replace(/,/g, '') || '0');

    if (btc && eth && sol) {
      return res.json({ BTC: btc, ETH: eth, SOL: sol });
    }

    throw new Error("Invalid GPT data");
  } catch (err) {
    console.warn("⚠️ GPT failed or returned invalid data. Using CoinGecko fallback...");
    try {
      const data = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd").then(r => r.json());
      return res.json({
        BTC: data.bitcoin.usd,
        ETH: data.ethereum.usd,
        SOL: data.solana.usd
      });
    } catch (fallbackErr) {
      console.error("❌ CoinGecko Fallback Failed:", fallbackErr.message);
      res.status(500).json({ BTC: "Error", ETH: "Error", SOL: "Error" });
    }
  }
});

// 🧠 CrimznBot: Answer any user question
app.post('/ask', async (req, res) => {
  try {
    const question = req.body.message;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are CrimznBot, a crypto strategist with expertise in trading, macroeconomics, and DeFi. You combine the insights of Raoul Pal, Michael Saylor, and Cathie Wood. Keep responses sharp, informed, and practical.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0.5
    });

    res.send(response.choices[0].message.content);
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).send("CrimznBot is offline.");
  }
});

// 📊 PulseIt: Smart sentiment tracker
app.post('/pulseit', async (req, res) => {
  try {
    const topic = req.body.topic || "crypto market";
    const pulse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are PulseIt, a smart market sentiment bot. Provide a short and bold market sentiment summary (max 30 words).'
        },
        {
          role: 'user',
          content: `What's the current sentiment on ${topic}?`
        }
      ],
      temperature: 0.4
    });

    res.send(pulse.choices[0].message.content);
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).send("PulseIt is offline.");
  }
});

// 📄 Whitepaper download
app.get('/whitepaper', (req, res) => {
  const whitepaperPath = path.join(__dirname, 'public', 'whitepaper.pdf');
  if (require('fs').existsSync(whitepaperPath)) {
    res.sendFile(whitepaperPath);
  } else {
    res.status(404).send("Whitepaper not found.");
  }
});

// 📰 Dynamic blog route
app.get('/blog/:date', (req, res) => {
  const blogPath = path.join(__dirname, 'public', 'blog', `${req.params.date}.html`);
  if (require('fs').existsSync(blogPath)) {
    res.sendFile(blogPath);
  } else {
    res.status(404).send("Blog post not found.");
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ CrimznBot is live @ http://localhost:${PORT}`);
});

