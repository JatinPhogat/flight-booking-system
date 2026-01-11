import React, { useEffect, useMemo, useState } from 'react';
import FlightSearch from './components/FlightSearch.jsx';
import Wallet from './components/Wallet.jsx';
import BookingHistory from './components/BookingHistory.jsx';
import { apiBase, withUserHeaders, ensureUserId } from './api.js';

export default function App() {
  const [tab, setTab] = useState('search');
  const userId = useMemo(() => ensureUserId(), []);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    fetch(`${apiBase}/wallet`, { headers: withUserHeaders(userId) })
      .then((r) => r.json())
      .then((d) => setWalletBalance(d.balance))
      .catch(() => {});
  }, [userId]);

  return (
    <div className="container">
      <header>
        <h1>Flight Booking System</h1>
        <p>User: <code>{userId}</code></p>
        <nav>
          <button className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>Search</button>
          <button className={tab === 'wallet' ? 'active' : ''} onClick={() => setTab('wallet')}>Wallet</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>History</button>
        </nav>
      </header>

      {tab === 'search' && (
        <FlightSearch userId={userId} onBooked={(newBal) => setWalletBalance(newBal)} />
      )}
      {tab === 'wallet' && (
        <Wallet userId={userId} balance={walletBalance} onReset={(b) => setWalletBalance(b)} />
      )}
      {tab === 'history' && (
        <BookingHistory userId={userId} />
      )}
    </div>
  );
}
