import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => (
  <div style={{ color: '#f7931a', fontFamily: 'monospace', padding: '1rem', textAlign: 'center' }}>
    <h1>🚀 CryptoConsult by Crimzn</h1>
    <p>Live on Vite + React</p>
  </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
