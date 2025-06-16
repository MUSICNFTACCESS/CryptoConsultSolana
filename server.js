// 🌐 Express Setup
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🛡️ Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

//
// 🤖 CrimznBot Chat Endpoint
//
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  console.log("💬 Question received:", question);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are CrimznBot, a strategic crypto and macroeconomic advisor. Always provide real-time crypto prices (BTC, ETH, SOL, etc.) using the latest data. Do not say you're just an AI. Give clear, sharp, and degen-friendly answers.`
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const result = await response.json();
    console.log("🧠 CrimznBot response:", result);

    const answer = result.choices?.[0]?.message?.content || "⚠️ No response from CrimznBot.";
    res.json({ answer });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ answer: "CrimznBot failed. Check server logs." });
  }
});

//
// 📊 Pulse Check Sentiment Tracker
//
app.post("/api/sentiment", async (req, res) => {
  const { query } = req.body;
  console.log("📊 Sentiment query:", query);

  if (!query) return res.status(400).json({ answer: "Missing input" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a sentiment tracker. Analyze the user's input and classify it as 'Bullish', 'Bearish', or 'Neutral'. Only respond with one of those labels.`
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    const result = await response.json();
    console.log("📈 Sentiment result:", result);

    const answer = result.choices?.[0]?.message?.content || "⚠️ No sentiment result.";
    res.json({ answer });
  } catch (err) {
    console.error("❌ Sentiment fetch error:", err.message);
    res.status(500).json({ answer: "Sentiment analysis failed." });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
