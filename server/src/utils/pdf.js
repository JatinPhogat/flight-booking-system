const PDFDocument = require('pdfkit');

function streamTicketPDF(res, booking) {
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
}

module.exports = { streamTicketPDF };
