const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const { DepositInvoice, Booking, Room, User, Notification, sequelize } = require('../models');
const {
  issueOrResendForBooking,
  resendDepositNotificationByInvoiceId,
} = require('../services/depositInvoice.service');

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  // Admin cần tải nhiều bản ghi để đối chiếu booking chưa có hóa đơn
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(20),
});

const paramsIdSchema = z.object({ depositInvoiceId: z.string().uuid() });
const paramsBookingSchema = z.object({ bookingId: z.string().uuid() });

const issueBodySchema = z.object({
  resendNotification: z.boolean().optional().default(false),
});

const patchAdminBodySchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']),
});

async function list(req, res) {
  const { page, pageSize } = req.query;
  const where = {};
  if (req.user.role !== 'admin') where.userId = req.user.id;

  const include = [
    {
      model: Booking,
      as: 'booking',
      attributes: ['id', 'startDate', 'endDate', 'status', 'roomId'],
    },
    { model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth', 'address'] },
  ];
  if (req.user.role === 'admin') {
    include.push({ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'], required: false });
  }

  const { count, rows } = await DepositInvoice.findAndCountAll({
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
  const invoice = await DepositInvoice.findByPk(req.params.depositInvoiceId, {
    include: [
      { model: Booking, as: 'booking', attributes: ['id', 'startDate', 'endDate', 'status', 'note'] },
      { model: Room, as: 'room', attributes: ['id', 'title', 'pricePerMonth', 'address'] },
    ],
  });
  if (!invoice) throw new ApiError(404, 'Deposit invoice not found');
  if (req.user.role !== 'admin' && invoice.userId !== req.user.id) {
    throw new ApiError(403, 'Forbidden');
  }
  res.json({ message: 'OK', data: invoice });
}

async function issueForBooking(req, res) {
  const { resendNotification } = req.body;
  const result = await sequelize.transaction(async (t) =>
    issueOrResendForBooking(req.params.bookingId, { resendNotification }, t)
  );
  res.json({
    message: result.created ? 'Đã tạo và gửi hóa đơn đặt cọc' : 'Đã xử lý (hóa đơn đã tồn tại)',
    data: result.invoice,
    meta: { created: result.created, notified: result.notified },
  });
}

async function resendNotification(req, res) {
  await sequelize.transaction(async (t) => resendDepositNotificationByInvoiceId(req.params.depositInvoiceId, t));
  res.json({ message: 'Đã gửi lại thông báo hóa đơn cọc' });
}

async function patchAdmin(req, res) {
  const invoice = await DepositInvoice.findByPk(req.params.depositInvoiceId);
  if (!invoice) throw new ApiError(404, 'Deposit invoice not found');
  const prevStatus = invoice.status;
  const nextStatus = req.body.status;
  if (prevStatus === nextStatus) {
    return res.json({ message: 'OK', data: invoice });
  }

  await sequelize.transaction(async (t) => {
    await invoice.update({ status: nextStatus }, { transaction: t });
    if (prevStatus === 'pending' && nextStatus === 'paid') {
      await Notification.create(
        {
          userId: invoice.userId,
          type: 'deposit_paid',
          title: 'Đã xác nhận thanh toán cọc',
          body: `Admin đã xác nhận bạn đã thanh toán cọc (hóa đơn ${invoice.invoiceCode}).`,
          payload: {
            depositInvoiceId: invoice.id,
            roomId: invoice.roomId,
            invoiceCode: invoice.invoiceCode,
          },
        },
        { transaction: t }
      );
    }
  });

  await invoice.reload();
  res.json({ message: 'Cập nhật trạng thái hóa đơn cọc thành công', data: invoice });
}

module.exports = {
  list: [requireAuth, validate({ query: listQuerySchema }), list],
  getById: [requireAuth, validate({ params: paramsIdSchema }), getById],
  patchAdmin: [
    requireAuth,
    requireRole('admin'),
    validate({ params: paramsIdSchema }),
    validate({ body: patchAdminBodySchema }),
    patchAdmin,
  ],
  issueForBooking: [
    requireAuth,
    requireRole('admin'),
    validate({ params: paramsBookingSchema }),
    validate({ body: issueBodySchema }),
    issueForBooking,
  ],
  resendNotification: [
    requireAuth,
    requireRole('admin'),
    validate({ params: paramsIdSchema }),
    resendNotification,
  ],
};
