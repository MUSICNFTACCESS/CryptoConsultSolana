const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Serve frontend from /public explicitly
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ✅ Route for CrimznBot (chat questions)
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: question }],
        max_tokens: 200
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No response";
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

// ✅ Route for Market Sentiment (Pulse It)
app.post("/api/sentiment", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Summarize the current crypto sentiment surrounding the following topic:"
          },
          { role: "user", content: query }
        ],
        max_tokens: 150
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No summary found";
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: "Sentiment request failed" });
  }
});

// ✅ Fallback for unknown routes
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
  console.log(\`✅ Server running on http://localhost:\${PORT}\`);
});
