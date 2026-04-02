const { z } = require('zod');
const { Op } = require('sequelize');

const { ApiError } = require('../middlewares/errorHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadAvatar } = require('../middlewares/upload');

const { User } = require('../models');

async function me(req, res) {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'fullName', 'email', 'role', 'avatarUrl', 'createdAt', 'updatedAt'],
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

async function adminList(req, res) {
  const users = await User.findAll({
    attributes: ['id', 'fullName', 'email', 'role', 'avatarUrl', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
  });
  res.json({ message: 'OK', data: users });
}

const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  fullName: z.string().min(2).optional(),
});

async function adminUpdate(req, res) {
  const { id } = req.params;
  const patch = req.body;

  const user = await User.findByPk(id);
  if (!user) throw new ApiError(404, 'User not found');

  if (patch.fullName !== undefined) user.fullName = patch.fullName;
  if (patch.role !== undefined) user.role = patch.role;

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
  adminList: [requireAuth, requireRole('admin'), adminList],
  adminUpdate: [
    requireAuth,
    requireRole('admin'),
    validate({ body: updateUserRoleSchema }),
    adminUpdate,
  ],
  adminDelete: [requireAuth, requireRole('admin'), adminDelete],
};
