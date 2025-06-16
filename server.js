const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REQUIRED_SOL = 0.025;
const DESTINATION_ADDRESS = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🤖 CrimznBot Chat Endpoint
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are CrimznBot, a strategic crypto and macroeconomic analyst who speaks with the voice of Raoul Pal, Michael Saylor, and Cathie Wood. Always include live crypto prices for BTC, ETH, SOL, and other tokens when asked. Include ETF flow trends or macroeconomic insights when relevant. Be confident, opinionated, and data-backed. Never say you're just an AI assistant.`
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content || "No response from CrimznBot.";
    res.json({ answer });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ answer: "CrimznBot failed. Check server logs." });
  }
});

// 📊 Pulse Check Endpoint
app.post("/api/sentiment", async (req, res) => {
  const { query } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a crypto sentiment bot. Analyze the user's message and summarize its tone as bullish, bearish, or neutral."
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content || "No sentiment result.";
    res.json({ answer });
  } catch (err) {
    console.error("❌ Sentiment error:", err.message);
    res.status(500).json({ answer: "Sentiment check failed." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CrimznBot server running at http://localhost:${PORT}`);
});
