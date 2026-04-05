const { z } = require('zod');

const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadAvatar } = require('../middlewares/upload');

const { User } = require('../models');

async function me(req, res) {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'fullName', 'email', 'phone', 'role', 'avatarUrl', 'createdAt', 'updatedAt'],
  });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ message: 'OK', data: user });
}

async function updateAvatar(req, res) {
  if (!req.file) throw new ApiError(400, 'Missing avatar file');
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  await User.update({ avatarUrl }, { where: { id: req.user.id } });
  res.json({ message: 'Avatar updated', data: { avatarUrl } });
}

const patchMeSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z
    .union([z.string().max(20), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? null : v)),
});

async function patchMe(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  const patch = req.body;
  if (patch.fullName !== undefined) user.fullName = patch.fullName;
  if (patch.phone !== undefined) user.phone = patch.phone;
  await user.save();
  res.json({
    message: 'OK',
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}

async function adminList(req, res) {
  const users = await User.findAll({
    attributes: ['id', 'fullName', 'email', 'phone', 'role', 'avatarUrl', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
  });
  res.json({ message: 'OK', data: users });
}

const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  fullName: z.string().min(2).optional(),
  phone: z
    .union([z.string().max(20), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? null : v)),
});

async function adminUpdate(req, res) {
  const { id } = req.params;
  const patch = req.body;

  const user = await User.findByPk(id);
  if (!user) throw new ApiError(404, 'User not found');

  if (patch.fullName !== undefined) user.fullName = patch.fullName;
  if (patch.role !== undefined) user.role = patch.role;
  if (patch.phone !== undefined) user.phone = patch.phone;

  await user.save();
  res.json({ message: 'User updated', data: user });
}

async function adminDelete(req, res) {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) throw new ApiError(404, 'User not found');
  await user.destroy();
  res.json({ message: 'User deleted' });
}

module.exports = {
  me: [requireAuth, me],
  updateAvatar: [requireAuth, uploadAvatar.single('avatar'), updateAvatar],
  patchMe: [requireAuth, validate({ body: patchMeSchema }), patchMe],
  adminList: [requireAuth, requireRole('admin'), adminList],
  adminUpdate: [
    requireAuth,
    requireRole('admin'),
    validate({ body: updateUserRoleSchema }),
    adminUpdate,
  ],
  adminDelete: [requireAuth, requireRole('admin'), adminDelete],
};
