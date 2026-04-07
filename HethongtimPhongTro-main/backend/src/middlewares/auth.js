const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError, ApiError } = require('../core/errors/AppError');

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

// Attach current user to req.user based on JWT.
function requireAuth(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) throw new UnauthorizedError('Missing Authorization token');

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new ApiError({ statusCode: 500, message: 'JWT_SECRET is not configured' });

    const payload = jwt.verify(token, secret);
    // payload should contain: sub (userId), role, email
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Forbidden: insufficient permissions'));
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
