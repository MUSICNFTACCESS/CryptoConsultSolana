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
      <div class="bot">⚠️ Free limit reached. Please choose one:</div>
    `;
    paymentSection.innerHTML = `
      <button class="button" onclick="window.open('solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025&label=CryptoConsult&message=Consultation%20Payment')">
        🟢 Pay with Solana
      </button>
      <button class="button" onclick="window.open('mailto:crimzncipriano@gmail.com?subject=CryptoConsultation&body=Hi%20Crimzn%2C%20I%27m%20interested%20in%20booking%20a%20consultation.')">
        📬 Contact Crimzn
      </button>
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
// 💸 Fetch crypto live prices
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
// 📊 Sentiment Tracker
//
async function getSentiment() {
  const query = sentimentQuery.value.trim();
  if (!query) return;
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
    sentimentResult.innerText = "Error analyzing sentiment.";
  }
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
