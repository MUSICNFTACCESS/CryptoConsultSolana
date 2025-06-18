let questionCount = 0;

document.getElementById("send-button").addEventListener("click", async () => {
  const input = document.getElementById("user-input");
  const question = input.value.trim();
  if (!question) return;

  questionCount++;
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = `<div class="user">🧑‍💻 ${question}</div>`;
  input.value = "";

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await response.json();
    chatBox.innerHTML += `<div class="bot">🤖 ${data.answer}</div>`;
  } catch (err) {
    chatBox.innerHTML += `<div class="bot">❌ Error: ${err.message}</div>`;
  }

  if (questionCount >= 3) {
    document.getElementById("user-input").disabled = true;
    document.getElementById("send-button").disabled = true;
    document.getElementById("paywall-options").style.display = "block";
  }
});

async function getSentiment() {
  const term = document.getElementById("sentiment-query").value.trim();
  const resBox = document.getElementById("sentiment-result");
  if (!term) return resBox.textContent = "❌ Enter a term";

  resBox.textContent = "Loading...";
  try {
    const response = await fetch(`/pulse?query=${encodeURIComponent(term)}`);
    const data = await response.json();
    resBox.textContent = data.result || "No data found.";
  } catch (err) {
    resBox.textContent = "❌ Error fetching sentiment.";
  }
}

async function fetchPrices() {
  try {
    const res = await fetch("/prices");
    const { btc, eth, sol } = await res.json();
    document.getElementById("btc-price").textContent = `$${btc}`;
    document.getElementById("eth-price").textContent = `$${eth}`;
    document.getElementById("sol-price").textContent = `$${sol}`;
  } catch (error) {
    document.getElementById("btc-price").textContent = "$Error";
    document.getElementById("eth-price").textContent = "$Error";
    document.getElementById("sol-price").textContent = "$Error";
  }
}

async function connectPhantomWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      const pubkey = resp.publicKey.toString();
      const shortKey = pubkey.slice(0, 6) + "..." + pubkey.slice(-4);
      document.getElementById("wallet-address").textContent = "Connected: " + shortKey;
      document.getElementById("connect-wallet-btn").style.display = "none";
      document.getElementById("disconnect-wallet-btn").style.display = "inline-block";
    } catch (err) {
      console.error("User rejected connection:", err);                                          
    }
  } else {
    alert("Phantom Wallet not detected. Please install it.");
  }
}

function disconnectWallet() {
  document.getElementById("wallet-address").textContent = "";
  document.getElementById("connect-wallet-btn").style.display = "inline-block";
  document.getElementById("disconnect-wallet-btn").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connect-wallet-btn").addEventListener("click", connectPhantomWallet);
  document.getElementById("disconnect-wallet-btn").addEventListener("click", disconnectWallet);
  fetchPrices();
  setInterval(fetchPrices, 60000);
});
