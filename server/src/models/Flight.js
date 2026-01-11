const mongoose = require('mongoose');

const FlightSchema = new mongoose.Schema(
  {
    flight_id: { type: String, required: true, unique: true },
    airline: { type: String, required: true },
    departure_city: { type: String, required: true },
    arrival_city: { type: String, required: true },
    base_price: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

const Flight = mongoose.model('Flight', FlightSchema);
module.exports = { Flight };
