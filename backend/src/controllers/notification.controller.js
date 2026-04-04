const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const { Notification } = require('../models');

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  unreadOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true'),
});

const paramsNotificationSchema = z.object({ notificationId: z.string().uuid() });

async function unreadCount(req, res) {
  const count = await Notification.count({
    where: { userId: req.user.id, readAt: null },
  });
  res.json({ message: 'OK', data: { count } });
}

async function list(req, res) {
  const { page, pageSize, unreadOnly } = req.query;
  const where = { userId: req.user.id };
  if (unreadOnly) where.readAt = null;

  const [total, unreadCountVal, rows] = await Promise.all([
    Notification.count({ where }),
    Notification.count({ where: { userId: req.user.id, readAt: null } }),
    Notification.findAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['createdAt', 'DESC']],
    }),
  ]);

  res.json({
    message: 'OK',
    items: rows,
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      unreadCount: unreadCountVal,
    },
  });
}

async function markRead(req, res) {
  const n = await Notification.findByPk(req.params.notificationId);
  if (!n) throw new ApiError(404, 'Notification not found');
  if (n.userId !== req.user.id) throw new ApiError(403, 'Forbidden');
  await n.update({ readAt: new Date() });
  res.json({ message: 'OK', data: n });
}

async function markAllRead(req, res) {
  const [affected] = await Notification.update(
    { readAt: new Date() },
    { where: { userId: req.user.id, readAt: null } }
  );
  res.json({ message: 'OK', data: { updated: affected } });
}

module.exports = {
  unreadCount: [requireAuth, unreadCount],
  list: [requireAuth, validate({ query: listQuerySchema }), list],
  markRead: [requireAuth, validate({ params: paramsNotificationSchema }), markRead],
  markAllRead: [requireAuth, markAllRead],
};
