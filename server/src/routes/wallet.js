const express = require('express');
const { Wallet } = require('../models/Wallet');

const router = express.Router();

function getUserId(req) {
  return req.headers['x-user-id'] || req.cookies['x-user-id'] || 'demo-user';
}

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 50000 });
    }
    res.json({ userId, balance: wallet.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const userId = getUserId(req);
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { balance: 50000 },
      { upsert: true, new: true }
    );
    res.json({ userId, balance: wallet.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset wallet' });
  }
});

module.exports = router;
