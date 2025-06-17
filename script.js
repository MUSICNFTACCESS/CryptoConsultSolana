let connectedWallet = "";
let questionCount = 0;

document.addEventListener("DOMContentLoaded", () => {
  fetchPrices();
  setInterval(fetchPrices, 60000); // Refresh every 60s
});

// --- Price Feed (BTC/ETH/SOL) ---
async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("btc-price").textContent = `$${data.bitcoin.usd}`;
    document.getElementById("eth-price").textContent = `$${data.ethereum.usd}`;
    document.getElementById("sol-price").textContent = `$${data.solana.usd}`;
  } catch {
    document.getElementById("prices").innerText = "Price fetch error";
  }
}

// --- Ask CrimznBot ---
async function askQuestion() {
  const input = document.getElementById("question");
  const question = input.value.trim();
  if (!question) return;

  const chat = document.getElementById("chat-box");
  chat.innerHTML += `<p class="user">🧑 ${question}</p>`;
  input.value = "";

  if (questionCount >= 3) {
    document.getElementById("payment-options").style.display = "block";
    chat.innerHTML += `<p class="bot">🔒 CrimznBot is locked. You’ve reached your 3-question limit.</p>`;
    input.disabled = true;
    input.placeholder = "Access locked. Please pay to continue.";
    return;
  }

  questionCount++;

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    chat.innerHTML += `<p class="bot">🤖 ${data.reply || "No response"}</p>`;
  } catch {
    chat.innerHTML += `<p class="bot">❌ Failed to reach CrimznBot</p>`;
  }

  chat.scrollTop = chat.scrollHeight;
}

// --- PulseIt Sentiment ---
async function submitPulseIt() {
  const input = document.getElementById("pulseit-input").value.trim();
  const output = document.getElementById("pulseit-result");
  if (!input) {
    output.textContent = "⚠️ Please enter a topic.";
    return;
  }

  output.textContent = "🧠 Analyzing sentiment...";

  try {
    const res = await fetch("/pulseit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: input })
    });
    const data = await res.json();
    output.textContent = data.reply || "❌ No response from PulseIt.";
  } catch {
    output.textContent = "❌ PulseIt error. Try again.";
  }
}

// --- Phantom Wallet Connect ---
async function connectWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      connectedWallet = resp.publicKey.toString();
      document.getElementById("wallet-status").innerText = `🔗 ${connectedWallet}`;
      document.getElementById("connect-btn").style.display = "none";
      document.getElementById("disconnect-btn").style.display = "inline-block";
    } catch {
      alert("Wallet connection failed.");
    }
  } else {
    alert("Phantom wallet not found.");
  }
}

// --- Disconnect Wallet ---
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connect-btn");
  const disconnectBtn = document.getElementById("disconnect-btn");

  if (connectBtn) {
    connectBtn.addEventListener("click", connectWallet);
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", () => {
      connectedWallet = "";
      document.getElementById("wallet-status").innerText = "";
      disconnectBtn.style.display = "none";
      connectBtn.style.display = "inline-block";
      alert("Wallet disconnected.");
    });
  }
});
