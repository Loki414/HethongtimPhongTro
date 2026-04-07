const { DepositInvoice, Notification, Booking, Room } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');

function depositAmountHalfMonth(pricePerMonth) {
  const p = Number(pricePerMonth);
  if (!Number.isFinite(p) || p <= 0) return null;
  return Math.round((p / 2) * 100) / 100;
}

function makeInvoiceCode() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `DC-${y}${m}${day}-${r}`;
}

async function createDepositInvoiceRecord(booking, room, transaction) {
  if (!room) throw new ApiError(400, 'Không tìm thấy phòng để lập hóa đơn cọc.');
  const amount = depositAmountHalfMonth(room.pricePerMonth);
  if (amount == null) {
    throw new ApiError(400, 'Giá phòng không hợp lệ để tính tiền đặt cọc (cần > 0).');
  }
  const ppm = Number(room.pricePerMonth);
  return DepositInvoice.create(
    {
      bookingId: booking.id,
      userId: booking.userId,
      roomId: booking.roomId,
      invoiceCode: makeInvoiceCode(),
      amount,
      pricePerMonthSnapshot: ppm,
      status: 'pending',
    },
    { transaction }
  );
}

async function sendDepositInvoiceNotification(invoice, booking, roomTitle, transaction) {
  const amount = Number(invoice.amount);
  const formatted = new Intl.NumberFormat('vi-VN').format(amount);
  await Notification.create(
    {
      userId: booking.userId,
      type: 'deposit_invoice',
      title: 'Hóa đơn đặt cọc',
      body: `Hóa đơn ${invoice.invoiceCode}: đặt cọc ${formatted} đ (bằng ½ giá thuê 1 tháng) cho "${roomTitle || 'Phòng'}". Xem chi tiết tại mục Hóa đơn cọc.`,
      payload: {
        depositInvoiceId: invoice.id,
        bookingId: booking.id,
        roomId: booking.roomId,
        amount: String(amount),
        invoiceCode: invoice.invoiceCode,
      },
    },
    { transaction }
  );
}

/**
 * Khi booking vừa được xác nhận: tạo hóa đơn cọc (nếu chưa có) và gửi thông báo.
 * Bỏ qua nếu giá thuê không hợp lệ.
 */
async function tryCreateDepositOnConfirm(booking, room, roomTitle, transaction) {
  let r = room;
  if (!r || r.pricePerMonth == null) {
    r = await Room.findByPk(booking.roomId, {
      attributes: ['id', 'title', 'pricePerMonth'],
      transaction,
    });
  }
  if (!r) return null;

  const amount = depositAmountHalfMonth(r.pricePerMonth);
  if (amount == null) return null;

  const existing = await DepositInvoice.findOne({ where: { bookingId: booking.id }, transaction });
  if (existing) return existing;

  const invoice = await createDepositInvoiceRecord(booking, r, transaction);
  await sendDepositInvoiceNotification(invoice, booking, roomTitle, transaction);
  return invoice;
}

/**
 * Admin: đảm bảo có hóa đơn cho booking đã confirmed; tùy chọn gửi lại thông báo.
 */
async function issueOrResendForBooking(bookingId, { resendNotification }, transaction) {
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth'] }],
    transaction,
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== 'confirmed') {
    throw new ApiError(400, 'Chỉ tạo hóa đơn cọc cho booking đã được xác nhận (confirmed).');
  }

  const roomTitle = booking.room?.title || 'Phòng';
  let invoice = await DepositInvoice.findOne({ where: { bookingId: booking.id }, transaction });
  let created = false;

  if (!invoice) {
    const amount = depositAmountHalfMonth(booking.room?.pricePerMonth);
    if (amount == null) {
      throw new ApiError(400, 'Giá phòng không hợp lệ để tính tiền đặt cọc.');
    }
    invoice = await createDepositInvoiceRecord(booking, booking.room, transaction);
    created = true;
  }

  if (created || resendNotification) {
    await sendDepositInvoiceNotification(invoice, booking, roomTitle, transaction);
  }

  return { invoice, created, notified: created || resendNotification };
}

async function resendDepositNotificationByInvoiceId(depositInvoiceId, transaction) {
  const invoice = await DepositInvoice.findByPk(depositInvoiceId, { transaction });
  if (!invoice) throw new ApiError(404, 'Deposit invoice not found');

  const booking = await Booking.findByPk(invoice.bookingId, {
    include: [{ model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth'] }],
    transaction,
  });
  if (!booking) throw new ApiError(404, 'Booking not found');

  const roomTitle = booking.room?.title || 'Phòng';
  await sendDepositInvoiceNotification(invoice, booking, roomTitle, transaction);
  return invoice;
}

module.exports = {
  depositAmountHalfMonth,
  makeInvoiceCode,
  tryCreateDepositOnConfirm,
  issueOrResendForBooking,
  resendDepositNotificationByInvoiceId,
};
