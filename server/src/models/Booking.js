const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    flight_id: { type: String, required: true },
    airline: { type: String, required: true },
    departure_city: { type: String, required: true },
    arrival_city: { type: String, required: true },
    price_paid: { type: Number, required: true },
    passenger_name: { type: String, required: true },
    pnr: { type: String, required: true, unique: true },
    ticket_path: { type: String }
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = { Booking };
