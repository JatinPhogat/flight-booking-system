import React, { useEffect, useState } from 'react';
import { apiBase, withUserHeaders } from '../api.js';

export default function BookingHistory({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/bookings`, { headers: withUserHeaders(userId) });
      const data = await res.json();
      setItems(data.bookings || []);
    } catch (e) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>Booking History</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <table className="flights">
        <thead>
          <tr>
            <th>Passenger</th>
            <th>Airline</th>
            <th>Flight</th>
            <th>Route</th>
            <th>Price Paid</th>
            <th>Booking Time</th>
            <th>PNR</th>
            <th>Ticket</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id}>
              <td>{b.passenger_name}</td>
              <td>{b.airline}</td>
              <td>{b.flight_id}</td>
              <td>{b.departure_city} → {b.arrival_city}</td>
              <td>₹{b.price_paid}</td>
              <td>{new Date(b.createdAt).toLocaleString()}</td>
              <td>{b.pnr}</td>
              <td><a href={`${b.ticket_url}?userId=${userId}`} target="_blank" rel="noreferrer">Download</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
