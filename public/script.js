const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendButton = document.getElementById("send-button");
const paymentSection = document.getElementById("payment-options");
const btcPrice = document.getElementById("btc-price");
const ethPrice = document.getElementById("eth-price");
const solPrice = document.getElementById("sol-price");
const sentimentResult = document.getElementById("sentiment-result");
const sentimentQuery = document.getElementById("sentiment-query");

let questionCount = 0;
const maxFreeQuestions = 3;

async function handleCrimznBot(question) {
  chatBox.innerHTML += `<div class="user">🙋🏽‍♂️ ${question}</div>`;
  input.value = "";

  if (questionCount >= maxFreeQuestions) {
    chatBox.innerHTML += `
      <div class="bot">⚠️ Free limit reached. 
      Please <a class="button" href="https://commerce.coinbase.com/checkout/1d7cd946-d6ec-4278-b7ea-ee742b86982b" target="_blank">Tip 1 USDC</a>
      or <a class="button" href="https://t.me/CrimznBot" target="_blank">📬 Contact Crimzn</a>
      </div>
    `;
    paymentSection.style.display = "block";
    return;
  }

  try {
    const res = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    chatBox.innerHTML += `<div class="bot">🤖 ${data.answer}</div>`;
    questionCount++;
  } catch (err) {
    chatBox.innerHTML += `<div class="bot">❌ Error: Failed to fetch response</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

sendButton.onclick = () => {
  const question = input.value.trim();
  if (question) handleCrimznBot(question);
};

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const question = input.value.trim();
    if (question) handleCrimznBot(question);
  }
});

//
// 💸 Fetch Live Prices from CoinGecko
//
async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    btcPrice.textContent = "$" + data.bitcoin.usd.toLocaleString();
    ethPrice.textContent = "$" + data.ethereum.usd.toLocaleString();
    solPrice.textContent = "$" + data.solana.usd.toLocaleString();
  } catch (error) {
    btcPrice.textContent = "$Error";
    ethPrice.textContent = "$Error";
    solPrice.textContent = "$Error";
  }
}

//
// 📊 Alpha Pulse Sentiment Tracker
//
async function getSentiment() {
  const query = sentimentQuery.value.trim();
  if (!query) {
    sentimentResult.innerText = "❌ Enter a term";
    return;
  }

  sentimentResult.innerText = `🔍 Analyzing sentiment for "${query}"...`;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    sentimentResult.innerText = `📊 Sentiment for "${query}": ${data.summary || "Neutral"} (${data.sentiment_score || "N/A"})`;
  } catch (e) {
    sentimentResult.innerText = "❌ Error analyzing sentiment.";
  }
}

//
// 🔓 Phantom Wallet Connect
//
async function connectPhantomWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      const pubkey = resp.publicKey.toString();
      const shortKey = pubkey.slice(0, 6) + "..." + pubkey.slice(-6);
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

//
// 🚀 On Load
//
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connect-wallet-btn").addEventListener("click", connectPhantomWallet);
  document.getElementById("disconnect-wallet-btn").addEventListener("click", disconnectWallet);
  fetchPrices();
  setInterval(fetchPrices, 60000);
});
