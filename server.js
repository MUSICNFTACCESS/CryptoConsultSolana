const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 🧠 CrimznBot GPT-4o Logic
app.post('/ask', async (req, res) => {
  const userQuestion = req.body.question;
  try {
    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_price',
          description: 'Get the current price of a token like BTC, ETH, SOL',
          parameters: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: 'The crypto symbol (e.g., BTC, ETH, SOL)',
              },
            },
            required: ['symbol'],
          },
        },
      },
    ];

    const run = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            "You are CrimznBot, a crypto-savvy assistant built by Crimzn. You provide expert insights, live prices, and real-time sentiment tracking.",
        },
        { role: 'user', content: userQuestion },
      ],
      tools,
      tool_choice: 'auto',
    });

    const toolCall = run.choices[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.name === 'get_price') {
      const args = JSON.parse(toolCall.function.arguments);
      const price = await fetchPrice(args.symbol);
      const reply = { role: 'tool', content: `The current price of ${args.symbol.toUpperCase()} is $${price}` };

      const secondRun = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are CrimznBot with crypto tools.' },
          { role: 'user', content: userQuestion },
          toolCall,
          reply,
        ],
      });

      return res.json({ answer: secondRun.choices[0].message.content });
    }

    return res.json({ answer: run.choices[0].message.content });
  } catch (err) {
    console.error('CrimznBot error:', err);
    res.status(500).json({
      answer: "🚧 CrimznBot had a glitch. Try again or ask Crimzn directly.",
    });
  }
});

// 🔍 PulseIt+ Sentiment Tracker
app.post('/sentiment', async (req, res) => {
  const keyword = req.body.query;
  try {
    const pulse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are PulseIt+, a tool that analyzes market sentiment based on keywords like "ETH", "Trump", or "inflation". Provide a quick insight.',
        },
        {
          role: 'user',
          content: `Analyze the crypto sentiment around: ${keyword}`,
        },
      ],
    });

    res.json({ sentiment: pulse.choices[0].message.content });
  } catch (err) {
    console.error('PulseIt error:', err);
    res.status(500).json({ sentiment: '⚠️ PulseIt is temporarily down.' });
  }
});

// 🔁 Helper: CoinGecko API for real-time prices
async function fetchPrice(symbol) {
  const idMap = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
  };

  const id = idMap[symbol.toUpperCase()] || symbol.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;

  const res = await fetch(url);
  const data = await res.json();
  return data[id]?.usd || 'N/A';
}

app.listen(port, () => {
  console.log(`🚀 CrimznBot server running at http://localhost:${port}`);
});
