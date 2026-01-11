import React, { useEffect, useState } from 'react';
import { apiBase, withUserHeaders } from '../api.js';

export default function Wallet({ userId, balance, onReset }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localBalance, setLocalBalance] = useState(balance);

  useEffect(() => setLocalBalance(balance), [balance]);

  async function resetWallet() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/wallet/reset`, {
        method: 'POST',
        headers: withUserHeaders(userId)
      });
      const data = await res.json();
      setLocalBalance(data.balance);
      onReset && onReset(data.balance);
    } catch (e) {
      setError('Failed to reset wallet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Wallet</h2>
      {error && <p className="error">{error}</p>}
      <p>Balance: ₹{localBalance ?? '...'}</p>
      <button onClick={resetWallet} disabled={loading}>{loading ? 'Resetting...' : 'Reset to ₹50,000'}</button>
    </div>
  );
}
