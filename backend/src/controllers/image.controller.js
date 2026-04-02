const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const { Image, Room } = require('../models');
const { invalidateRoomsCache } = require('../core/cache/roomsCache');

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  roomId: z.string().uuid().optional(),
});

const createImageSchema = z.object({
  roomId: z.string().uuid(),
  url: z.string().min(1),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.coerce.number().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const updateImageSchema = createImageSchema.partial();
const paramsImageSchema = z.object({ imageId: z.string().uuid() });

async function list(req, res) {
  const { page, pageSize, roomId } = req.query;
  const where = {};
  if (roomId) where.roomId = roomId;

  const { count, rows } = await Image.findAndCountAll({
    where,
    distinct: true,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['sortOrder', 'ASC']],
  });

  res.json({
    message: 'OK',
    items: rows,
    meta: { total: count, page, pageSize, pageCount: Math.ceil(count / pageSize) },
  });
}

async function getById(req, res) {
  const image = await Image.findByPk(req.params.imageId);
  if (!image) throw new ApiError(404, 'Image not found');
  res.json({ message: 'OK', data: image });
}

async function create(req, res) {
  const created = await Image.create(req.body);
  await invalidateRoomsCache();
  res.status(201).json({ message: 'Image created', data: created });
}

async function update(req, res) {
  const image = await Image.findByPk(req.params.imageId);
  if (!image) throw new ApiError(404, 'Image not found');
  await image.update(req.body);
  await invalidateRoomsCache();
  res.json({ message: 'Image updated', data: image });
}

async function remove(req, res) {
  const image = await Image.findByPk(req.params.imageId);
  if (!image) throw new ApiError(404, 'Image not found');
  await image.destroy();
  await invalidateRoomsCache();
  res.json({ message: 'Image deleted' });
}

module.exports = {
  list: [requireAuth, validate({ query: listQuerySchema }), list],
  getById: [requireAuth, validate({ params: paramsImageSchema }), getById],
  create: [requireAuth, requireRole('admin'), validate({ body: createImageSchema }), create],
  update: [requireAuth, requireRole('admin'), validate({ params: paramsImageSchema }), validate({ body: updateImageSchema }), update],
  remove: [requireAuth, requireRole('admin'), validate({ params: paramsImageSchema }), remove],
};
