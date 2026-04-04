const { z } = require('zod');
const { Op } = require('sequelize');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadRoomImages } = require('../middlewares/upload');

const asyncHandler = require('../utils/asyncHandler');
const { Room, Image } = require('../models');
const roomService = require('../services/room.service');
const { getCachedRoomsList, setCachedRoomsList } = require('../core/cache/roomsCache');
const { invalidateRoomsCache } = require('../core/cache/roomsCache');

const listRoomsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  locationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  q: z.string().optional(),
  // Accept: amenityIds=uuid1,uuid2
  amenityIds: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : undefined)),
});

const createRoomBodySchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  pricePerMonth: z.coerce.number().positive(),
  areaSqm: z.coerce.number().positive().optional(),
  address: z.string().optional(),
  categoryId: z.string().uuid(),
  locationId: z.string().uuid(),
  amenityIds: z
    .array(z.string().uuid())
    .optional()
    .default([]),
});

const updateRoomBodySchema = createRoomBodySchema.partial().extend({
  amenityIds: z.array(z.string().uuid()).optional(),
});

const roomIdParams = z.object({
  roomId: z.string().uuid(),
});

async function list(req, res) {
  const cached = await getCachedRoomsList(req.query);
  if (cached) {
    return res.json({ message: 'OK', ...cached, cached: true });
  }

  const result = await roomService.listRooms({ query: req.query });
  await setCachedRoomsList(req.query, result);
  res.json({ message: 'OK', ...result });
}

async function getById(req, res) {
  const room = await roomService.getRoomById(req.params.roomId);
  if (!room) throw new ApiError(404, 'Room not found');
  res.json({ message: 'OK', data: room });
}

async function create(req, res) {
  const payload = req.body;
  const created = await roomService.createRoom({
    userId: req.user.id,
    payload,
  });
  res.status(201).json({ message: 'Room created', data: created });
}

async function update(req, res) {
  const updated = await roomService.updateRoom({
    user: req.user,
    roomId: req.params.roomId,
    payload: req.body,
  });
  if (!updated) throw new ApiError(403, 'Forbidden or room not found');
  res.json({ message: 'Room updated', data: updated });
}

async function remove(req, res) {
  const ok = await roomService.deleteRoom({ user: req.user, roomId: req.params.roomId });
  if (!ok) throw new ApiError(403, 'Forbidden or room not found');
  res.json({ message: 'Room deleted' });
}

async function uploadImages(req, res) {
  const { roomId } = req.params;
  const room = await Room.findByPk(roomId);
  if (!room) throw new ApiError(404, 'Room not found');

  const isOwner = room.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new ApiError(403, 'Forbidden');

  if (!req.files || !req.files.length) throw new ApiError(400, 'No files uploaded');

  const createdImages = await Promise.all(
    req.files.map((file, idx) =>
      Image.create({
        roomId,
        url: `/uploads/rooms/${file.filename}`,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sortOrder: idx,
      })
    )
  );

  await invalidateRoomsCache();
  res.status(201).json({ message: 'Images uploaded', data: createdImages });
}

module.exports = {
  list: [validate({ query: listRoomsQuerySchema }), asyncHandler(list)],
  getById: [validate({ params: roomIdParams }), asyncHandler(getById)],
  create: [requireAuth, requireRole('admin'), validate({ body: createRoomBodySchema }), asyncHandler(create)],
  update: [
    requireAuth,
    requireRole('admin'),
    validate({ params: roomIdParams }),
    validate({ body: updateRoomBodySchema }),
    asyncHandler(update),
  ],
  remove: [requireAuth, requireRole('admin'), validate({ params: roomIdParams }), asyncHandler(remove)],
  uploadImages: [
    requireAuth,
    requireRole('admin'),
    validate({ params: roomIdParams }),
    uploadRoomImages.array('images', 10),
    asyncHandler(uploadImages),
  ],
};
