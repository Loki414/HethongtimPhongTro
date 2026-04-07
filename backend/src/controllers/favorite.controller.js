const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const { Favorite, Room, Category, Location, Image } = require('../models');

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

const createFavoriteSchema = z.object({
  roomId: z.string().uuid(),
});

const updateFavoriteSchema = z.object({
  roomId: z.string().uuid().optional(),
});

const paramsFavoriteSchema = z.object({ favoriteId: z.string().uuid() });

async function list(req, res) {
  const { page, pageSize } = req.query;
  const where = {};
  if (req.user.role !== 'admin') where.userId = req.user.id;

  const { count, rows } = await Favorite.findAndCountAll({
    where,
    include: [
      {
        model: Room,
        as: 'room',
        attributes: ['id', 'title', 'pricePerMonth', 'address'],
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'], required: false },
          { model: Location, as: 'location', attributes: ['id', 'name'], required: false },
          { model: Image, as: 'images', attributes: ['id', 'url', 'sortOrder'], required: false },
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
  const favorite = await Favorite.findByPk(req.params.favoriteId, {
    include: [{ model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth', 'address'] }],
  });
  if (!favorite) throw new ApiError(404, 'Favorite not found');
  if (req.user.role !== 'admin' && favorite.userId !== req.user.id) throw new ApiError(403, 'Forbidden');
  res.json({ message: 'OK', data: favorite });
}

async function create(req, res) {
  const { roomId } = req.body;
  const existing = await Favorite.findOne({
    where: { userId: req.user.id, roomId },
  });
  if (existing) return res.status(200).json({ message: 'Already favorited', data: existing });

  const created = await Favorite.create({ userId: req.user.id, roomId });
  res.status(201).json({ message: 'Favorited', data: created });
}

async function update(req, res) {
  const favorite = await Favorite.findByPk(req.params.favoriteId);
  if (!favorite) throw new ApiError(404, 'Favorite not found');
  if (req.user.role !== 'admin' && favorite.userId !== req.user.id) throw new ApiError(403, 'Forbidden');

  await favorite.update(req.body);
  res.json({ message: 'Favorite updated', data: favorite });
}

async function remove(req, res) {
  const favorite = await Favorite.findByPk(req.params.favoriteId);
  if (!favorite) throw new ApiError(404, 'Favorite not found');
  if (req.user.role !== 'admin' && favorite.userId !== req.user.id) throw new ApiError(403, 'Forbidden');

  await favorite.destroy();
  res.json({ message: 'Favorite deleted' });
}

module.exports = {
  list: [requireAuth, validate({ query: listQuerySchema }), list],
  getById: [requireAuth, validate({ params: paramsFavoriteSchema }), getById],
  create: [requireAuth, validate({ body: createFavoriteSchema }), create],
  update: [requireAuth, validate({ params: paramsFavoriteSchema }), validate({ body: updateFavoriteSchema }), update],
  remove: [requireAuth, validate({ params: paramsFavoriteSchema }), remove],
};
