// 🔁 Load Prices from GPT or CoinGecko
async function getPrices() {
  try {
    const res = await fetch("/prices");
    const data = await res.json();
    updatePriceUI(data.BTC, data.ETH, data.SOL);
  } catch {
    updatePriceUI("Error", "Error", "Error");
  }
}

function updatePriceUI(btc, eth, sol) {
  document.getElementById("btc-price").textContent = `$${btc}`;
  document.getElementById("eth-price").textContent = `$${eth}`;
  document.getElementById("sol-price").textContent = `$${sol}`;
}

// 💬 CrimznBot Logic
async function sendMessage() {
  const input = document.getElementById("crimzn-input");
  const chat = document.getElementById("chat-container");
  const userMsg = input.value.trim();
  if (!userMsg) return;

  const userDiv = document.createElement("div");
  userDiv.className = "message user";
  userDiv.textContent = userMsg;
  chat.appendChild(userDiv);

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: userMsg })
    });
    const data = await res.json();

    const botDiv = document.createElement("div");
    botDiv.className = "message bot";
    botDiv.textContent = data.reply || "No reply received.";
    chat.appendChild(botDiv);
  } catch {
    const botDiv = document.createElement("div");
    botDiv.className = "message bot";
    botDiv.textContent = "CrimznBot encountered an error.";
    chat.appendChild(botDiv);
  }

  input.value = "";
}

// 📡 PulseIt Logic (GPT-based)
async function analyzePulseIt() {
  const input = document.getElementById("pulseit-input").value.trim();
  const output = document.getElementById("pulseit-response");
  if (!input) return;

  try {
    const res = await fetch("/pulseit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });
    const data = await res.json();
    output.textContent = `📡 PulseIt: ${data.sentiment}`;
  } catch {
    output.textContent = "PulseIt is offline or failed.";
  }
}

// 🔗 WalletConnect Placeholder
function connectWallet() {
  alert("WalletConnect logic coming soon — connection placeholder.");
}

// 🔄 Init
getPrices();
