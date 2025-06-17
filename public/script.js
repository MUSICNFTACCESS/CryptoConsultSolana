let questionCount = 0;
const maxFreeQuestions = 3;

function appendMessage(text, sender = 'bot') {
  const chatBox = document.getElementById('chat-box');
  const message = document.createElement('div');
  message.className = `message ${sender}`;
  message.textContent = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const query = input.value.trim();
  if (!query) return;

  appendMessage(query, 'user');
  input.value = '';

  questionCount++;
  if (questionCount > maxFreeQuestions) {
    document.getElementById('paywall').style.display = 'block';
    return;
  }

  try {
    const res = await fetch('https://cryptoconsultsolana.onrender.com/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query })
    });

    const data = await res.json();
    appendMessage(data.reply || '⚠️ No response received from CrimznBot.', 'bot');
  } catch (err) {
    appendMessage('⚠️ Error reaching CrimznBot.', 'bot');
  }
}

async function checkPulse() {
  const topic = document.getElementById('pulse-topic').value.trim();
  const resultBox = document.getElementById('pulse-result');
  if (!topic) return;

  resultBox.textContent = '🔄 Checking sentiment...';
  try {
    const encodedTopic = encodeURIComponent(topic);
    const res = await fetch(`https://cryptoconsultsolana.onrender.com/pulseit?topic=${encodedTopic}`);
    const html = await res.text();
    const match = html.match(/<p>(.*?)<\/p>/i);
    resultBox.textContent = match ? match[1] : '⚠️ No sentiment returned.';
  } catch (err) {
    resultBox.textContent = '⚠️ Failed to fetch sentiment.';
  }
}

async function updatePrices() {
  try {
    const res = await fetch('https://cryptoconsultsolana.onrender.com/prices');
    const prices = await res.json();
    document.getElementById('btc-price').textContent = prices.BTC || 'N/A';
    document.getElementById('eth-price').textContent = prices.ETH || 'N/A';
    document.getElementById('sol-price').textContent = prices.SOL || 'N/A';
  } catch {
    document.getElementById('btc-price').textContent = 'Error';
    document.getElementById('eth-price').textContent = 'Error';
    document.getElementById('sol-price').textContent = 'Error';
  }
}

updatePrices();
setInterval(updatePrices, 30000);
