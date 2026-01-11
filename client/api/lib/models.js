const { mongoose } = require('./db');

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

const PriceAdjustmentSchema = new mongoose.Schema(
  {
    flight_id: { type: String, required: true, index: true },
    increased_by_percent: { type: Number, required: true, default: 10 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);
PriceAdjustmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    flight_id: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);
AttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

const WalletSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 50000 }
  },
  { timestamps: true }
);

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

const Flight = mongoose.models.Flight || mongoose.model('Flight', FlightSchema);
const PriceAdjustment = mongoose.models.PriceAdjustment || mongoose.model('PriceAdjustment', PriceAdjustmentSchema);
const Attempt = mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);
const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

module.exports = { Flight, PriceAdjustment, Attempt, Wallet, Booking };
