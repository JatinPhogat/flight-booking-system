const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    flight_id: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

AttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

const Attempt = mongoose.model('Attempt', AttemptSchema);
module.exports = { Attempt };
