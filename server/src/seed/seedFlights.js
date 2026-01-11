const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Flight } = require('../models/Flight');

dotenv.config();

const airlines = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara'];
const cities = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFlights(n = 15) {
  const flights = [];
  let idCounter = 1001;
  for (let i = 0; i < n; i++) {
    const dep = cities[randomInt(0, cities.length - 1)];
    let arr = cities[randomInt(0, cities.length - 1)];
    if (arr === dep) arr = cities[(cities.indexOf(dep) + 1) % cities.length];
    flights.push({
      flight_id: `IX${idCounter++}`,
      airline: airlines[randomInt(0, airlines.length - 1)],
      departure_city: dep,
      arrival_city: arr,
      base_price: randomInt(2000, 3000)
    });
  }
  return flights;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected');

  const count = await Flight.countDocuments();
  if (count >= 10) {
    console.log('Flights already seeded (>=10). Skipping.');
    process.exit(0);
  }

  const flights = generateFlights(15);
  await Flight.insertMany(flights, { ordered: false }).catch(() => {});
  console.log(`Seeded ${flights.length} flights.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
