const jwt = require('jsonwebtoken');
const { ApiError } = require('../middlewares/errorHandler');
const { User } = require('../models');

async function register({ fullName, email, password, role }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already exists');

  const user = User.build({ fullName, email, role: role || 'user' });
  await user.setPassword(password);
  await user.save();

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const ok = await user.validatePassword(password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured');

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  };
}

module.exports = { register, login };
