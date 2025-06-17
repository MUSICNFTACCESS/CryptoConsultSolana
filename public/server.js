const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// --- Real-Time Price Helper ---
async function fetchPrices() {
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ondo-finance&vs_currencies=usd';
    const { data } = await axios.get(url);
    return {
      btc: data.bitcoin.usd,
      eth: data.ethereum.usd,
      sol: data.solana.usd,
      ondo: data['ondo-finance']?.usd || 'N/A'
    };
  } catch (err) {
    console.error("❌ Price fetch error:", err.message);
    return null;
  }
}

// --- CrimznBot AI Route ---
app.post('/ask', async (req, res) => {
  const { question } = req.body;
  console.log("💬 CrimznBot Q:", question);

  try {
    const prices = await fetchPrices();
    let priceInfo = "";

    if (prices) {
      priceInfo = `\n\nCurrent Prices:\nBTC: $${prices.btc} | ETH: $${prices.eth} | SOL: $${prices.sol} | ONDO: $${prices.ondo}`;
    }

    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot — a sharp, confident, crypto-native AI that responds like Crimzn himself. Your answers are data-driven, with degen-professional tone. Always include relevant live price info if asked about a token."
        },
        {
          role: "user",
          content: `${question}${priceInfo}`
        }
      ],
      temperature: 0.7
    });

    const reply = chat.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ reply: "CrimznBot is offline. Try again soon." });
  }
});

// --- PulseIt Sentiment Tracker Route ---
app.post('/pulseit', async (req, res) => {
  const { topic } = req.body;
  console.log("📡 PulseIt:", topic);

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You're PulseIt — a crypto-native sentiment pulse-check engine. Return sharp, confident summaries of market mood for any token or topic. Think like an alpha tracker."
        },
        {
          role: "user",
          content: `Pulse it: ${topic}`
        }
      ],
      temperature: 0.6
    });

    const reply = chat.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).json({ reply: "PulseIt engine offline. Try again later." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend live @ http://localhost:${PORT}`);
});

