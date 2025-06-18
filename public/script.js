let questionCount = 0;
const maxQuestions = 3;

const askBtn = document.getElementById("askBtn");
const askInput = document.getElementById("askInput");
const responseDiv = document.getElementById("response");

const pulseBtn = document.getElementById("pulseBtn");
const pulseInput = document.getElementById("pulseInput");
const pulseResponse = document.getElementById("pulseResponse");

async function fetchPrices() {
  try {
    const res = await fetch("/prices");
    const data = await res.json();
    document.getElementById("btc").textContent = `$${data.BTC}`;
    document.getElementById("eth").textContent = `$${data.ETH}`;
    document.getElementById("sol").textContent = `$${data.SOL}`;
  } catch {
    document.getElementById("btc").textContent = "Error";
    document.getElementById("eth").textContent = "Error";
    document.getElementById("sol").textContent = "Error";
  }
}

askBtn.addEventListener("click", async () => {
  if (!askInput.value.trim()) return;

  if (questionCount >= maxQuestions) {
    responseDiv.innerHTML = `
      <p><strong>Free limit reached.</strong></p>
      <p><a href="https://commerce.coinbase.com/checkout/1d7cd946-d6ec-4278-b7ea-ee742b86982b" target="_blank">💵 Pay $99.99 for Services Rendered</a></p>
      <p><a href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">☕ Send Tip (1 USDC)</a></p>
      <p><a href="https://t.me/Crimznbot" target="_blank">📲 Contact Me via Telegram</a></p>
    `;
    return;
  }

  const msg = askInput.value;
  askInput.value = "";
  responseDiv.innerHTML = `<p style="color:orange;">You: ${msg}</p><p>CrimznBot: Typing...</p>`;

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const txt = await res.text();
    responseDiv.innerHTML = `<p style="color:orange;">You: ${msg}</p><p style="color:lime;">CrimznBot: ${txt}</p>`;
    questionCount++;
  } catch (err) {
    responseDiv.innerHTML = `<p style="color:red;">Error contacting CrimznBot.</p>`;
  }
});

pulseBtn.addEventListener("click", async () => {
  const topic = pulseInput.value || "crypto";
  pulseInput.value = "";
  pulseResponse.innerHTML = "📡 Analyzing...";

  try {
    const res = await fetch(`/pulseitTopic?topic=${encodeURIComponent(topic)}`);
    const txt = await res.text();
    pulseResponse.innerHTML = `📊 ${txt}`;
  } catch {
    pulseResponse.innerHTML = "⚠️ PulseIt offline.";
  }
});

window.onload = () => {
  fetchPrices();

  if (window.solana && window.solana.isPhantom) {
    document.getElementById("connectWalletBtn").addEventListener("click", async () => {
      try {
        const resp = await window.solana.connect();
        alert(`✅ Connected: ${resp.publicKey.toString()}`);
      } catch {
        alert("❌ Wallet connection failed.");
      }
    });
  }
};
