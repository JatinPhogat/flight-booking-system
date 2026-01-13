const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Flight } = require('../models/Flight');
const { Wallet } = require('../models/Wallet');
const { Booking } = require('../models/Booking');
const { Attempt } = require('../models/Attempt');
const { PriceAdjustment } = require('../models/PriceAdjustment');
const { streamTicketPDF } = require('../utils/pdf');

const router = express.Router();

function getUserId(req) {
  return req.headers['x-user-id'] || req.cookies['x-user-id'] || 'demo-user';
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

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 }).lean();
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
      ticket_url: `${process.env.APP_URL || 'http://localhost:4000'}/api/bookings/${b._id}/ticket`
    }));
    res.json({ bookings: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { passenger_name, flight_id } = req.body;
    if (!passenger_name || !flight_id) {
      return res.status(400).json({ error: 'passenger_name and flight_id are required' });
    }

    // Get current price BEFORE adding the new attempt
    const priceInfo = await getCurrentPrice(flight_id);
    if (!priceInfo) return res.status(404).json({ error: 'Flight not found' });

    const wallet = await Wallet.findOne({ userId });
    const balance = wallet ? wallet.balance : 0;
    if (balance < priceInfo.current_price) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // Create the booking at current price
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

    // NOW record the attempt AFTER successful booking
    await Attempt.create({ userId, flight_id });

    // Check if we should create surge pricing (after 3rd successful booking)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const attemptCount = await Attempt.countDocuments({
      userId,
      flight_id,
      createdAt: { $gt: fiveMinAgo }
    });

    if (attemptCount >= 3) {
      const existingAdj = await PriceAdjustment.findOne({
        flight_id,
        expiresAt: { $gt: new Date() }
      });
      if (!existingAdj) {
        await PriceAdjustment.create({
          flight_id,
          increased_by_percent: 10,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
      }
    }

    const ticket_url = `${process.env.APP_URL || 'http://localhost:4000'}/api/bookings/${booking._id}/ticket`;

    res.json({
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
    res.status(500).json({ error: 'Booking failed' });
  }
});

router.get('/:id/ticket', async (req, res) => {
  try {
    const userId = req.query.userId || getUserId(req);
    const { id } = req.params;
    const booking = await Booking.findOne({ _id: id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    // Verify the booking belongs to this user
    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    streamTicketPDF(res, booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

module.exports = router;
