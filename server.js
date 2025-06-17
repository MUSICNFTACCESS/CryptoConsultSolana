import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// CrimznBot System Personality
const SYSTEM_PROMPT = `You are CrimznBot, a strategic, degen-but-professional crypto advisor.
You follow macro investor styles like Raoul Pal, Michael Saylor, and James from InvestAnswers.
You analyze charts, ETF flows, and smart references to E-reserve, M2 supply, BTC dominance, and real on-chain trends.
Your tone is honest and practical — built for traders and investors who want signal, not noise.`;

// Route: /ask → GPT-4o or price feed fallback
app.post("/ask", async (req, res) => {
  const question = req.body.question?.toLowerCase() || "";
  const wallet = req.body.wallet || "";

  console.log("🧠 CrimznBot /ask hit");
  console.log("Question:", question);
  console.log("Wallet:", wallet);

  const match = question.match(/\b(?:price|value) of (\w+)\b/);
  if (match) {
    const token = match[1].toLowerCase();
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`);
      const data = await response.json();
      const id = Object.keys(data)[0];
      return res.json({ reply: `📊 The current price of ${token.toUpperCase()} is $${data[id].usd}` });
    } catch (err) {
      return res.status(500).json({ reply: "❌ Failed to fetch token price from CoinGecko." });
    }
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: req.body.question }
      ]
    });
    const botReply = chatResponse.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (err) {
    console.error("❌ CrimznBot error:", err);
    res.status(500).json({ reply: "❌ CrimznBot is offline — check API or try again shortly." });
  }
});

// Route: /prices → BTC, ETH, SOL
app.get("/prices", async (req, res) => {
  console.log("📈 /prices endpoint hit");
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd`);
    const data = await response.json();
    res.json({
      BTC: data.bitcoin.usd,
      ETH: data.ethereum.usd,
      SOL: data.solana.usd
    });
  } catch (err) {
    console.error("❌ Price API error:", err);
    res.status(500).json({ BTC: "Error", ETH: "Error", SOL: "Error" });
  }
});

// Route: /pulseit → GPT-4o sentiment engine
app.post("/pulseit", async (req, res) => {
  const topic = req.body.topic;
  if (!topic) return res.status(400).json({ reply: "❌ No topic provided." });

  try {
    const pulseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a lightning-fast sentiment engine. Return clean, structured sentiment analysis in 3 lines: Sentiment, Rationale, Tone." },
        { role: "user", content: `What is the sentiment on: ${topic}?` }
      ]
    });

    const result = pulseResponse.choices[0].message.content;
    res.json({ reply: result });
  } catch (err) {
    console.error("❌ PulseIt error:", err);
    res.status(500).json({ reply: "❌ PulseIt is offline. Try again later." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 CrimznBot is live at http://localhost:${PORT}`);
});
