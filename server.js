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

//
// 🤖 CrimznBot Chat Endpoint
//
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!OPENAI_API_KEY) {
    console.error("❌ Missing OpenAI API key");
    return res.status(500).json({ answer: "CrimznBot config error." });
  }

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
    const answer = result.choices?.[0]?.message?.content || "⚠️ No answer returned.";
    res.json({ answer });
  } catch (err) {
    console.error("❌ Error calling OpenAI:", err.message);
    res.status(500).json({ answer: "CrimznBot failed. Check server logs." });
  }
});

//
// 🔓 Solana Unlock Verification
//
app.post("/verify-sol", async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ status: "error", message: "Missing wallet" });

  try {
    const txRes = await fetch(`https://public-api.solscan.io/account/transactions?address=${wallet}&limit=5`, {
      headers: { accept: "application/json" }
    });
    const txs = await txRes.json();

    const matched = txs.find(tx =>
      tx.parsedInstruction?.some(instr =>
        instr.type === "transfer" &&
        instr.destination === DESTINATION_ADDRESS &&
        parseFloat(instr.lamports || 0) >= REQUIRED_SOL * 1e9
      )
    );

    if (matched) {
      res.json({ status: "unlocked" });
    } else {
      res.json({ status: "locked" });
    }
  } catch (err) {
    console.error("❌ Solana verify error:", err.message);
    res.status(500).json({ status: "error", message: "Verification failed." });
  }
});

//
// 📊 Pulse It Sentiment Tracker
//
app.post("/api/sentiment", async (req, res) => {
  const { query } = req.body;
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
            content: "You are a sentiment analysis bot. Summarize and classify the sentiment of the user's input as bullish, bearish, or neutral. Keep it short."
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content || "⚠️ No sentiment result.";
    console.log("📈 Sentiment result:", result);
    res.json({ answer });
  } catch (err) {
    console.error("❌ Sentiment fetch error:", err.message);
    res.status(500).json({ answer: "Sentiment analysis failed." });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🧠 CrimznBot v0.0.1 running on port ${PORT}`);
});
