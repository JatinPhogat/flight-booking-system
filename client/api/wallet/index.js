const { connect } = require('../lib/db');
const { Wallet } = require('../lib/models');

function getUserId(req) {
  return req.headers['x-user-id'] || 'demo-user';
}

module.exports = async (req, res) => {
  await connect();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const userId = getUserId(req);
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 50000 });
    res.json({ userId, balance: wallet.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
};
