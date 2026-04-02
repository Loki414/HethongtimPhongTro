const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const { Report } = require('../models');

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  roomId: z.string().uuid().optional(),
});

const createReportSchema = z.object({
  roomId: z.string().uuid(),
  reason: z.string().min(5),
});

const updateReportSchema = z.object({
  reason: z.string().min(5).optional(),
  status: z.enum(['open', 'resolved']).optional(),
});

const paramsReportSchema = z.object({ reportId: z.string().uuid() });

async function list(req, res) {
  const { page, pageSize, roomId } = req.query;
  const where = {};
  if (req.user.role !== 'admin') where.reporterId = req.user.id;
  if (roomId) where.roomId = roomId;

  const result = await Report.findAndCountAll({
    where,
    distinct: true,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['createdAt', 'DESC']],
  });

  res.json({
    message: 'OK',
    items: result.rows,
    meta: {
      total: result.count,
      page,
      pageSize,
      pageCount: Math.ceil(result.count / pageSize),
    },
  });
}

async function getById(req, res) {
  const report = await Report.findByPk(req.params.reportId);
  if (!report) throw new ApiError(404, 'Report not found');
  if (req.user.role !== 'admin' && report.reporterId !== req.user.id) throw new ApiError(403, 'Forbidden');
  res.json({ message: 'OK', data: report });
}

async function create(req, res) {
  const created = await Report.create({
    reporterId: req.user.id,
    roomId: req.body.roomId,
    reason: req.body.reason,
  });
  res.status(201).json({ message: 'Report created', data: created });
}

async function update(req, res) {
  const report = await Report.findByPk(req.params.reportId);
  if (!report) throw new ApiError(404, 'Report not found');
  if (req.user.role !== 'admin' && report.reporterId !== req.user.id) throw new ApiError(403, 'Forbidden');

  if (req.user.role !== 'admin' && req.body.status !== undefined) {
    throw new ApiError(403, 'Only admin can update report status');
  }

  await report.update(req.body);
  res.json({ message: 'Report updated', data: report });
}

async function remove(req, res) {
  const report = await Report.findByPk(req.params.reportId);
  if (!report) throw new ApiError(404, 'Report not found');
  if (req.user.role !== 'admin' && report.reporterId !== req.user.id) throw new ApiError(403, 'Forbidden');
  await report.destroy();
  res.json({ message: 'Report deleted' });
}

module.exports = {
  list: [requireAuth, validate({ query: listQuerySchema }), list],
  getById: [requireAuth, validate({ params: paramsReportSchema }), getById],
  create: [requireAuth, validate({ body: createReportSchema }), create],
  update: [requireAuth, validate({ params: paramsReportSchema }), validate({ body: updateReportSchema }), update],
  remove: [requireAuth, validate({ params: paramsReportSchema }), remove],
};
