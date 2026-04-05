const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const { Booking, Room, Category, Location, User, Notification, sequelize } = require('../models');
const { tryCreateDepositOnConfirm } = require('../services/depositInvoice.service');

function toYmdLocal(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** Cộng đúng 1 tháng dương lịch, clamp ngày (VD 31/1 → 28/2 hoặc 29/2). */
function addOneMonthClamp(fromDate) {
  const s = fromDate instanceof Date ? fromDate : new Date(fromDate);
  if (Number.isNaN(s.getTime())) return null;
  const y = s.getFullYear();
  const m = s.getMonth();
  const day = s.getDate();
  const lastInTargetMonth = new Date(y, m + 2, 0).getDate();
  const useDay = Math.min(day, lastInTargetMonth);
  return new Date(y, m + 1, useDay);
}

/** Kết thúc kỳ thuê sau `months` tháng (lặp addOneMonthClamp). */
function expectedEndAfterMonths(startDate, months) {
  const n = Number(months);
  if (!Number.isFinite(n) || n < 1) return null;
  let cur = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
  if (Number.isNaN(cur.getTime())) return null;
  for (let i = 0; i < n; i++) {
    const next = addOneMonthClamp(cur);
    if (!next || Number.isNaN(next.getTime())) return null;
    cur = next;
  }
  return cur;
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  roomId: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
});

const createBookingSchema = z
  .object({
    roomId: z.string().uuid(),
    startDate: z.coerce.date(),
    months: z.coerce.number().int().min(1).max(36).optional().default(1),
    endDate: z.coerce.date().optional(),
    note: z.string().optional(),
  })
  .transform((d) => {
    const months = d.months ?? 1;
    const expected = expectedEndAfterMonths(d.startDate, months);
    const end = d.endDate ?? expected;
    return { roomId: d.roomId, startDate: d.startDate, months, endDate: end, note: d.note };
  })
  .superRefine((d, ctx) => {
    const expected = expectedEndAfterMonths(d.startDate, d.months);
    if (!expected || Number.isNaN(expected.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'Ngày bắt đầu hoặc số tháng không hợp lệ' });
      return;
    }
    if (toYmdLocal(d.endDate) !== toYmdLocal(expected)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: `Ngày kết thúc phải là ${toYmdLocal(expected)} (đúng ${d.months} tháng từ ngày bắt đầu, tính theo lịch).`,
      });
    }
  });

const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  note: z.string().optional(),
});

const paramsBookingSchema = z.object({ bookingId: z.string().uuid() });

async function list(req, res) {
  const { page, pageSize, roomId, status } = req.query;
  const where = {};
  if (roomId) where.roomId = roomId;
  if (status) where.status = status;
  // User sees own bookings; admin sees all.
  if (req.user.role !== 'admin') where.userId = req.user.id;

  const include = [
    {
      model: Room,
      as: 'room',
      attributes: ['id', 'title', 'pricePerMonth', 'address'],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'], required: false },
        { model: Location, as: 'location', attributes: ['id', 'name'], required: false },
      ],
    },
  ];
  if (req.user.role === 'admin') {
    include.push({ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'], required: false });
  }

  const { count, rows } = await Booking.findAndCountAll({
    where,
    include,
    distinct: true,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['createdAt', 'DESC']],
  });

  res.json({
    message: 'OK',
    items: rows,
    meta: {
      total: count,
      page,
      pageSize,
      pageCount: Math.ceil(count / pageSize),
    },
  });
}

async function getById(req, res) {
  const booking = await Booking.findByPk(req.params.bookingId, {
    include: [{ model: Room, as: 'room' }],
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
    throw new ApiError(403, 'Forbidden');
  }
  res.json({ message: 'OK', data: booking });
}

async function create(req, res) {
  // Use transaction to keep booking flow consistent (especially if later we add checks/conflicts).
  const created = await sequelize.transaction(async (t) => {
    const room = await Room.findByPk(req.body.roomId, { transaction: t, attributes: ['id'] });
    if (!room) throw new ApiError(404, 'Room not found');

    const { roomId, startDate, endDate, note } = req.body;
    return Booking.create(
      {
        userId: req.user.id,
        roomId,
        startDate,
        endDate,
        note,
      },
      { transaction: t }
    );
  });
  res.status(201).json({ message: 'Booking created', data: created });
}

async function update(req, res) {
  const booking = await Booking.findByPk(req.params.bookingId, {
    include: [{ model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth'] }],
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
    throw new ApiError(403, 'Forbidden');
  }

  // User can cancel their booking; admins can do everything.
  const patch = req.body;
  if (req.user.role !== 'admin' && patch.status && patch.status !== 'cancelled') {
    throw new ApiError(403, 'Users can only cancel bookings');
  }

  const prevStatus = booking.status;
  const isAdmin = req.user.role === 'admin';
  const roomTitle = booking.room?.title || 'Phòng';
  // Sau `booking.update()`, Sequelize có thể gỡ association `room` khỏi instance → giữ ref trước khi update.
  const roomForDeposit = booking.room;

  await sequelize.transaction(async (t) => {
    await booking.update(patch, { transaction: t });

    if (isAdmin && patch.status === 'confirmed' && prevStatus !== 'confirmed') {
      await Notification.create(
        {
          userId: booking.userId,
          type: 'booking_confirmed',
          title: 'Đặt phòng được chấp nhận',
          body: `Lịch thuê "${roomTitle}" (${booking.startDate} → ${booking.endDate}) đã được admin xác nhận.`,
          payload: { bookingId: booking.id, roomId: booking.roomId },
        },
        { transaction: t }
      );
      await tryCreateDepositOnConfirm(booking, roomForDeposit, roomTitle, t);
    } else if (isAdmin && patch.status === 'cancelled' && prevStatus === 'pending') {
      await Notification.create(
        {
          userId: booking.userId,
          type: 'booking_rejected',
          title: 'Lịch đặt phòng bị từ chối',
          body: `Yêu cầu thuê "${roomTitle}" (${booking.startDate} → ${booking.endDate}) không được chấp nhận.`,
          payload: { bookingId: booking.id, roomId: booking.roomId },
        },
        { transaction: t }
      );
    }
  });

  await booking.reload({
    include: [
      { model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth', 'address'] },
    ],
  });
  res.json({ message: 'Booking updated', data: booking });
}

async function remove(req, res) {
  const booking = await Booking.findByPk(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
    throw new ApiError(403, 'Forbidden');
  }
  await booking.destroy();
  res.json({ message: 'Booking deleted' });
}

module.exports = {
  list: [requireAuth, validate({ query: listQuerySchema }), list],
  getById: [requireAuth, validate({ params: paramsBookingSchema }), getById],
  create: [requireAuth, validate({ body: createBookingSchema }), create],
  update: [requireAuth, validate({ params: paramsBookingSchema }), validate({ body: updateBookingSchema }), update],
  remove: [requireAuth, validate({ params: paramsBookingSchema }), remove],
};
