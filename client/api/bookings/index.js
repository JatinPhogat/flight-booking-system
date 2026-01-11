const { connect } = require('../lib/db');
const { v4: uuidv4 } = require('uuid');
const { Flight, Wallet, Booking, Attempt, PriceAdjustment } = require('../lib/models');

function getUserId(req) {
  return req.headers['x-user-id'] || 'demo-user';
}

async function getCurrentPrice(flight_id) {
  const flight = await Flight.findOne({ flight_id }).lean();
  if (!flight) return null;
  const adj = await PriceAdjustment.findOne({
    flight_id,
    expiresAt: { $gt: new Date() }
  }).lean();
  const surgePercent = adj ? adj.increased_by_percent : 0;
  const current_price = Math.round(
    flight.base_price * (surgePercent ? 1 + surgePercent / 100 : 1)
  );
  return { flight, current_price, surgePercent };
}

module.exports = async (req, res) => {
  await connect();
  const userId = getUserId(req);

  if (req.method === 'GET') {
    try {
      const bookings = await Booking.find({ userId }).sort({ createdAt: -1 }).lean();
      const appUrl = process.env.APP_URL || '';
      const items = bookings.map((b) => ({
        id: b._id,
        passenger_name: b.passenger_name,
        airline: b.airline,
        flight_id: b.flight_id,
        departure_city: b.departure_city,
        arrival_city: b.arrival_city,
        price_paid: b.price_paid,
        pnr: b.pnr,
        createdAt: b.createdAt,
        ticket_url: `${appUrl}/api/bookings/${b._id}/ticket`
      }));
      return res.json({ bookings: items });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { passenger_name, flight_id } = req.body || {};
      if (!passenger_name || !flight_id) {
        return res.status(400).json({ error: 'passenger_name and flight_id are required' });
      }

      await Attempt.create({ userId, flight_id });
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const attemptCount = await Attempt.countDocuments({
        userId,
        flight_id,
        createdAt: { $gt: fiveMinAgo }
      });

      if (attemptCount >= 3) {
        const existingAdj = await PriceAdjustment.findOne({ flight_id, expiresAt: { $gt: new Date() } });
        if (!existingAdj) {
          await PriceAdjustment.create({
            flight_id,
            increased_by_percent: 10,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
          });
        }
      }

      const priceInfo = await getCurrentPrice(flight_id);
      if (!priceInfo) return res.status(404).json({ error: 'Flight not found' });

      let wallet = await Wallet.findOne({ userId });
      if (!wallet) wallet = await Wallet.create({ userId, balance: 50000 });
      const balance = wallet.balance;
      if (balance < priceInfo.current_price) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      const newBalance = balance - priceInfo.current_price;
      await Wallet.updateOne({ userId }, { balance: newBalance }, { upsert: true });

      const pnr = uuidv4().split('-')[0].toUpperCase();
      const booking = await Booking.create({
        userId,
        flight_id,
        airline: priceInfo.flight.airline,
        departure_city: priceInfo.flight.departure_city,
        arrival_city: priceInfo.flight.arrival_city,
        price_paid: priceInfo.current_price,
        passenger_name,
        pnr
      });

      const appUrl = process.env.APP_URL || '';
      const ticket_url = `${appUrl}/api/bookings/${booking._id}/ticket`;

      return res.json({
        booking: {
          id: booking._id,
          passenger_name,
          airline: priceInfo.flight.airline,
          flight_id,
          departure_city: priceInfo.flight.departure_city,
          arrival_city: priceInfo.flight.arrival_city,
          price_paid: priceInfo.current_price,
          pnr,
          createdAt: booking.createdAt,
          ticket_url
        },
        wallet: { balance: newBalance }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Booking failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
