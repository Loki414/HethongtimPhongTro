const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadRoomImages } = require('../middlewares/upload');

const { Booking, Room, Category, Location, sequelize } = require('../models');

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  roomId: z.string().uuid().optional(),
});

const createBookingSchema = z.object({
  roomId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  note: z.string().optional(),
}).refine((d) => d.endDate >= d.startDate, { message: 'endDate must be >= startDate' });

const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  note: z.string().optional(),
});

const paramsBookingSchema = z.object({ bookingId: z.string().uuid() });

async function list(req, res) {
  const { page, pageSize, roomId } = req.query;
  const where = {};
  if (roomId) where.roomId = roomId;
  // User sees own bookings; admin sees all.
  if (req.user.role !== 'admin') where.userId = req.user.id;

  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: [
      {
        model: Room,
        as: 'room',
        attributes: ['id', 'title', 'pricePerMonth', 'address'],
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'], required: false },
          { model: Location, as: 'location', attributes: ['id', 'name'], required: false },
        ],
      },
    ],
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

    return Booking.create(
      {
        userId: req.user.id,
        roomId: req.body.roomId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        note: req.body.note,
      },
      { transaction: t }
    );
  });
  res.status(201).json({ message: 'Booking created', data: created });
}

async function update(req, res) {
  const booking = await Booking.findByPk(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
    throw new ApiError(403, 'Forbidden');
  }

  // User can cancel their booking; admins can do everything.
  const patch = req.body;
  if (req.user.role !== 'admin' && patch.status && patch.status !== 'cancelled') {
    throw new ApiError(403, 'Users can only cancel bookings');
  }

  await booking.update(patch);
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
