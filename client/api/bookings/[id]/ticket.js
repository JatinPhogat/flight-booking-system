const { connect } = require('../../lib/db');
const { Booking } = require('../../lib/models');
const PDFDocument = require('pdfkit');

module.exports = async (req, res) => {
  await connect();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { id } = req.query;
    const booking = await Booking.findOne({ _id: id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${booking.pnr}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Flight Ticket', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Passenger: ${booking.passenger_name}`);
    doc.text(`Airline: ${booking.airline}`);
    doc.text(`Flight ID: ${booking.flight_id}`);
    doc.text(`Route: ${booking.departure_city} → ${booking.arrival_city}`);
    doc.text(`PNR: ${booking.pnr}`);
    doc.text(`Price Paid: ₹${booking.price_paid}`);
    doc.text(`Booking Time: ${new Date(booking.createdAt || Date.now()).toLocaleString()}`);

    doc.moveDown();
    doc.text('Thank you for booking with us!', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
};
