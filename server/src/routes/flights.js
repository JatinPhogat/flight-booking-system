const express = require('express');
const { Flight } = require('../models/Flight');
const { PriceAdjustment } = require('../models/PriceAdjustment');

const router = express.Router();

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function currentSurgeMap(flightIds) {
  const adjustments = await PriceAdjustment.find({
    flight_id: { $in: flightIds },
    expiresAt: { $gt: new Date() }
  }).lean();
  const map = new Map();
  for (const adj of adjustments) {
    map.set(adj.flight_id, {
      percent: adj.increased_by_percent,
      expiresAt: adj.expiresAt
    });
  }
  return map;
}

router.get('/', async (req, res) => {
  try {
    const { departure, arrival } = req.query;
    const filter = {};
    if (departure && departure.trim()) {
      const d = departure.trim();
      filter.departure_city = new RegExp(`^${escapeRegex(d)}$`, 'i');
    }
    if (arrival && arrival.trim()) {
      const a = arrival.trim();
      filter.arrival_city = new RegExp(`^${escapeRegex(a)}$`, 'i');
    }

    const sort = req.query.sort;

    const flights = await Flight.find(filter).lean();
    const ids = flights.map((f) => f.flight_id);
    const surgeMap = await currentSurgeMap(ids);

    let result = flights.map((f) => {
      const surgeInfo = surgeMap.get(f.flight_id);
      const surgePercent = surgeInfo ? surgeInfo.percent : 0;
      const current_price = Math.round(
        f.base_price * (surgePercent ? 1 + surgePercent / 100 : 1)
      );
      return { ...f, current_price, surgePercent, surgeExpiresAt: surgeInfo ? surgeInfo.expiresAt : null };
    });

    if (sort === 'price_asc') {
      result.sort((a, b) => (a.current_price - b.current_price) || a.airline.toLowerCase().localeCompare(b.airline.toLowerCase()) || a.flight_id.localeCompare(b.flight_id));
    } else if (sort === 'price_desc') {
      result.sort((a, b) => (b.current_price - a.current_price) || a.airline.toLowerCase().localeCompare(b.airline.toLowerCase()) || a.flight_id.localeCompare(b.flight_id));
    } else if (sort === 'airline_asc') {
      result.sort((a, b) => a.airline.toLowerCase().localeCompare(b.airline.toLowerCase()) || a.flight_id.localeCompare(b.flight_id));
    } else if (sort === 'airline_desc') {
      result.sort((a, b) => b.airline.toLowerCase().localeCompare(a.airline.toLowerCase()) || a.flight_id.localeCompare(b.flight_id));
    }

    result = result.slice(0, 10);

    res.json({ flights: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flights' });
  }
});

router.get('/:flight_id', async (req, res) => {
  try {
    const { flight_id } = req.params;
    const f = await Flight.findOne({ flight_id }).lean();
    if (!f) return res.status(404).json({ error: 'Flight not found' });
    const surgeMap = await currentSurgeMap([flight_id]);
    const surgeInfo = surgeMap.get(flight_id);
    const surgePercent = surgeInfo ? surgeInfo.percent : 0;
    const current_price = Math.round(
      f.base_price * (surgePercent ? 1 + surgePercent / 100 : 1)
    );
    res.json({ ...f, current_price, surgePercent, surgeExpiresAt: surgeInfo ? surgeInfo.expiresAt : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flight' });
  }
});

module.exports = router;
