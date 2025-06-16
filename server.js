const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

//
// 🤖 CrimznBot Chat Endpoint
//
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
            content: "You are CrimznBot, a strategic crypto and macroeconomic advisor with a degen edge."
          },
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "No response.";
    res.json({ answer });
  } catch (error) {
    console.error("❌ OpenAI request failed:", error.message);
    res.status(500).json({ answer: null, error: "OpenAI request failed" });
  }
});

//
// 📈 Sentiment Analyzer
//
app.post("/api/sentiment", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

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
            content: "You are a crypto sentiment analyst. Analyze sentiment based on crypto market signals and language tone."
          },
          {
            role: "user",
            content: `Analyze sentiment for ${query}. Respond only with a quick pulse like 'Bullish', 'Bearish', or 'Neutral'.`
          }
        ]
      })
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || "No sentiment.";
    res.json({ result });
  } catch (error) {
    console.error("❌ Sentiment request failed:", error.message);
    res.status(500).json({ result: null, error: "Sentiment API failed" });
  }
});

//
// 🔓 Solana Unlock Endpoint
//
app.post("/verify-sol", async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ status: "Missing wallet address" });

  const yourAddress = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";

  try {
    const txRes = await fetch(`https://public-api.solscan.io/account/transactions?address=${wallet}&limit=10`, {
      headers: { accept: "application/json" }
    });

    const txs = await txRes.json();
    const matched = txs.find(tx =>
      tx.parsedInstruction?.some(instr =>
        instr.type === "transfer" &&
        instr.destination === yourAddress &&
        parseFloat(instr.lamports || 0) >= 0.025 * 1e9
      )
    );

    if (matched) {
      res.json({ status: "unlocked" });
    } else {
      res.json({ status: "locked" });
    }
  } catch (err) {
    console.error("❌ Solana verify error:", err.message);
    res.status(500).json({ status: "error" });
  }
});

//
// 🔓 Solana Unlock Verification Endpoint
//
app.post("/verify-sol", async (req, res) => {
  const { wallet } = req.body;
  const yourAddress = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
  const requiredAmount = 0.025;

  if (!wallet) return res.status(400).json({ status: "error", message: "Missing wallet address" });

  try {
    const txRes = await fetch(`https://public-api.solscan.io/account/transactions?address=${wallet}&limit=20`, {
      headers: { accept: "application/json" }
    });

    const txs = await txRes.json();
    const matched = txs.find(tx =>
      tx.parsedInstruction?.some(instr =>
        instr.type === "transfer" &&
        instr.destination === yourAddress &&
        parseFloat(instr.lamports || 0) >= requiredAmount * 1e9
      )
    );

    if (matched) {
      res.json({ status: "unlocked" });
    } else {
      res.json({ status: "locked" });
    }
  } catch (err) {
    console.error("❌ Solana verify error:", err.message);
    res.status(500).json({ status: "error", message: "Verification failed" });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

