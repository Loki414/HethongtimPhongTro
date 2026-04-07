const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { Booking, Review, Room, Category, Location } = require('../models');

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  roomId: z.string().uuid().optional(),
});

const createReviewSchema = z.object({
  roomId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
});

const paramsReviewSchema = z.object({ reviewId: z.string().uuid() });

async function list(req, res) {
  const { page, pageSize, roomId } = req.query;
  const where = {};
  if (roomId) where.roomId = roomId;
  if (req.user.role !== 'admin') where.userId = req.user.id;

  const { count, rows } = await Review.findAndCountAll({
    where,
    include: [{ model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth'] }],
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
  const review = await Review.findByPk(req.params.reviewId, {
    include: [{ model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth'] }],
  });
  if (!review) throw new ApiError(404, 'Review not found');
  if (req.user.role !== 'admin' && review.userId !== req.user.id) throw new ApiError(403, 'Forbidden');
  res.json({ message: 'OK', data: review });
}

async function create(req, res) {
  const created = await Review.create({
    userId: req.user.id,
    roomId: req.body.roomId,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  res.status(201).json({ message: 'Review created', data: created });
}

async function update(req, res) {
  const review = await Review.findByPk(req.params.reviewId);
  if (!review) throw new ApiError(404, 'Review not found');
  if (req.user.role !== 'admin' && review.userId !== req.user.id) throw new ApiError(403, 'Forbidden');

  await review.update(req.body);
  res.json({ message: 'Review updated', data: review });
}

async function remove(req, res) {
  const review = await Review.findByPk(req.params.reviewId);
  if (!review) throw new ApiError(404, 'Review not found');
  if (req.user.role !== 'admin' && review.userId !== req.user.id) throw new ApiError(403, 'Forbidden');
  await review.destroy();
  res.json({ message: 'Review deleted' });
}

module.exports = {
  list: [requireAuth, validate({ query: listQuerySchema }), list],
  getById: [requireAuth, validate({ params: paramsReviewSchema }), getById],
  create: [requireAuth, validate({ body: createReviewSchema }), create],
  update: [requireAuth, validate({ params: paramsReviewSchema }), validate({ body: updateReviewSchema }), update],
  remove: [requireAuth, validate({ params: paramsReviewSchema }), remove],
};
