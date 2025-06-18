
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Route: Serve index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.json());

// Existing routes
app.post("/ask", async (req, res) => {
  // your CrimznBot code...
});

app.post("/sentiment", async (req, res) => {
  // your PulseIt+ code...
});

app.listen(3000, () => console.log("✅ CrimznBot is live on port 3000"));

