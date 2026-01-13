import React, { useEffect, useState } from 'react';
import { apiBase, withUserHeaders } from '../api.js';

export default function FlightSearch({ userId, onBooked }) {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [sort, setSort] = useState('');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [tick, setTick] = useState(0);

  function toTitleCase(s) {
    if (!s) return '';
    return s
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function loadFlights() {
    setLoading(true);
    setError('');
    const url = new URL(`${apiBase}/flights`, window.location.origin);
    const dep = toTitleCase(departure.trim());
    const arr = toTitleCase(arrival.trim());
    if (dep) url.searchParams.set('departure', dep);
    if (arr) url.searchParams.set('arrival', arr);
    if (sort) url.searchParams.set('sort', sort);
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setFlights(d.flights || []);
        setDeparture(dep);
        setArrival(arr);
      })
      .catch(() => setError('Failed to load flights'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    loadFlights();
  }, [sort]);

  async function bookFlight(flight_id) {
    const name = prompt('Enter passenger name');
    if (!name) return;
    setError('');
    setInfo('');
    try {
      const res = await fetch(`${apiBase}/bookings`, {
        method: 'POST',
        headers: withUserHeaders(userId),
        body: JSON.stringify({ passenger_name: name, flight_id })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Booking failed');
        return;
      }
      setInfo(`Booked! PNR: ${data.booking.pnr}. Ticket: ${data.booking.ticket_url}`);
      if (onBooked) onBooked(data.wallet.balance);
      loadFlights();
      window.open(`${data.booking.ticket_url}?userId=${userId}`, '_blank');
    } catch (e) {
      setError('Booking failed');
    }
  }

  return (
    <div>
      <h2>Search Flights</h2>
      <div className="filters">
        <input placeholder="Departure city" value={departure} onChange={(e) => setDeparture(e.target.value)} />
        <input placeholder="Arrival city" value={arrival} onChange={(e) => setArrival(e.target.value)} />
        <select value={sort} onChange={(e) => { setSort(e.target.value); }}>
          <option value="">Sort: default</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="airline_asc">Airline A→Z</option>
          <option value="airline_desc">Airline Z→A</option>
        </select>
        <button onClick={loadFlights}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <table className="flights">
        <thead>
          <tr>
            <th>Airline</th>
            <th>Flight ID</th>
            <th>Route</th>
            <th>Base Price</th>
            <th>Current Price</th>
            <th>Surge</th>
            <th>Ends In</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {flights.map((f) => (
            <tr key={f.flight_id}>
              <td>{f.airline}</td>
              <td>{f.flight_id}</td>
              <td>{f.departure_city} → {f.arrival_city}</td>
              <td>₹{f.base_price}</td>
              <td>₹{f.current_price}</td>
              <td>{f.surgePercent ? `${f.surgePercent}%` : '-'}</td>
              <td>{renderCountdown(f.surgeExpiresAt, tick)}</td>
              <td><button onClick={() => bookFlight(f.flight_id)}>Book</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCountdown(expiresAt, tick) {
  if (!expiresAt) return '-';
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const ms = Math.max(0, end - now);
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
