const mongoose = require('mongoose');

const PriceAdjustmentSchema = new mongoose.Schema(
  {
    flight_id: { type: String, required: true, index: true },
    increased_by_percent: { type: Number, required: true, default: 10 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

PriceAdjustmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PriceAdjustment = mongoose.model('PriceAdjustment', PriceAdjustmentSchema);
module.exports = { PriceAdjustment };
