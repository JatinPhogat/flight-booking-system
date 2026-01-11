const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config();

const { Flight } = require('./models/Flight');
const flightsRouter = require('./routes/flights');
const walletRouter = require('./routes/wallet');
const bookingsRouter = require('./routes/bookings');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

async function start() {
  const app = express();

  app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());


  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/flights', flightsRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/bookings', bookingsRouter);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error', err);
    process.exit(1);
  }
}

start();
