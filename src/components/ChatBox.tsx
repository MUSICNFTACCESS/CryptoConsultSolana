import React, { useState } from 'react';
import { useAppState } from '../state/store';
import { payWithSol } from '../utils/payWithSol';

const ChatBox = ({ wallet }: { wallet: any }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const {
    walletConnected,
    hasPaid,
    freeQuestionsRemaining,
    decrementFreeQuestions,
    setHasPaid,
    setWalletConnected,
  } = useAppState();

  const handleSend = async () => {
    if (!wallet?.connected) {
      alert('Please connect your wallet');
      return;
    }

    if (!hasPaid && freeQuestionsRemaining <= 0) {
      const confirmPay = confirm('Free limit reached. Pay 0.025 SOL to unlock full access?');
      if (confirmPay) {
        const success = await payWithSol(wallet);
        if (success) {
          setHasPaid(true);
          alert('✅ Payment successful! You now have full access.');
        } else {
          alert('❌ Payment failed. Try again.');
        }
      }
      return;
    }

    if (!hasPaid) decrementFreeQuestions();

    setMessages([...messages, `🧠 CrimznBot: Response to "${input}"`]);
    setInput('');
  };

  return (
    <div>
      <h2>CrimznBot</h2>
      <div style={{ background: '#000', color: '#f7931a', padding: '1rem' }}>
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
        {!hasPaid && (
          <p>⚠️ Free questions left: {freeQuestionsRemaining}</p>
        )}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask CrimznBot..."
        style={{ width: '100%', padding: '0.5rem' }}
      />
      <button onClick={handleSend} style={{ marginTop: '0.5rem' }}>
        Send
      </button>
    </div>
  );
};

export default ChatBox;
