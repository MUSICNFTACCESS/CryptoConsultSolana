// 🌐 Basic Setup
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

console.log("🔑 OPENAI Key present:", !!OPENAI_KEY);
console.log("🟢 CrimznBot server starting...");

// ✅ CrimznBot AI Endpoint
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ answer: "Missing question." });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are CrimznBot, a strategic crypto and macroeconomic analyst who speaks with the voice of Raoul Pal, Michael Saylor, and Cathie Wood. Always include live crypto prices for BTC, ETH, SOL, and other tokens when asked. Include ETF flow trends or macroeconomic insights when relevant. Be confident, opinionated, and data-backed. Never say you're just an AI assistant.`,
          },
          {
            role: "user",
            content: question,
          }
        ]
      })
    });

    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content || "⚠️ No response from CrimznBot.";
    res.json({ answer });
  } catch (err) {
    console.error("❌ CrimznBot Error:", err.message);
    res.status(500).json({ answer: "CrimznBot failed. Check server logs." });
  }
});

// ✅ Sentiment Analysis Endpoint
app.post("/api/sentiment", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ answer: "Missing query." });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis bot. Summarize and classify the sentiment of the user's input as bullish, bearish, or neutral. Keep it short.",
          },
          {
            role: "user",
            content: query,
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

// ✅ Wallet Verification Endpoint (TEMP: Dev unlock)
app.post("/verify-sol", async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ status: "error", message: "Missing wallet" });

  if (wallet === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF") {
    return res.json({ status: "unlocked" });
  }

  return res.status(403).json({ status: "error", message: "Verification failed." });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot server running at http://localhost:${PORT}`);
});
