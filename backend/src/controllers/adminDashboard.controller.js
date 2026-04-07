const { requireAuth, requireRole } = require('../middlewares/auth');
const { Room, Booking, DepositInvoice } = require('../models');

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function dashboard(req, res) {
  const [
    roomsTotal,
    roomsAvailable,
    roomsRented,
    bookingsPending,
    bookingsConfirmed,
    bookingsCancelled,
    depPendingCount,
    depPendingSum,
    depPaidCount,
    depPaidSum,
    depCancelledCount,
    depCancelledSum,
  ] = await Promise.all([
    Room.count(),
    Room.count({ where: { status: 'available' } }),
    Room.count({ where: { status: 'rented' } }),
    Booking.count({ where: { status: 'pending' } }),
    Booking.count({ where: { status: 'confirmed' } }),
    Booking.count({ where: { status: 'cancelled' } }),
    DepositInvoice.count({ where: { status: 'pending' } }),
    DepositInvoice.sum('amount', { where: { status: 'pending' } }),
    DepositInvoice.count({ where: { status: 'paid' } }),
    DepositInvoice.sum('amount', { where: { status: 'paid' } }),
    DepositInvoice.count({ where: { status: 'cancelled' } }),
    DepositInvoice.sum('amount', { where: { status: 'cancelled' } }),
  ]);

  const bookingsTotal = bookingsPending + bookingsConfirmed + bookingsCancelled;

  res.json({
    message: 'OK',
    data: {
      rooms: {
        total: roomsTotal,
        available: roomsAvailable,
        rented: roomsRented,
      },
      bookings: {
        pending: bookingsPending,
        confirmed: bookingsConfirmed,
        cancelled: bookingsCancelled,
        total: bookingsTotal,
      },
      depositInvoices: {
        pending: { count: depPendingCount, amount: num(depPendingSum) },
        paid: { count: depPaidCount, amount: num(depPaidSum) },
        cancelled: { count: depCancelledCount, amount: num(depCancelledSum) },
      },
    },
  });
}

module.exports = {
  dashboard: [requireAuth, requireRole('admin'), dashboard],
};
