const mongoose = require('mongoose');

let cached = global.__mongooseConn;

async function connect() {
  if (cached) return cached;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  cached = mongoose.connect(uri, { autoIndex: true });
  global.__mongooseConn = cached;
  return cached;
}

module.exports = { mongoose, connect };
