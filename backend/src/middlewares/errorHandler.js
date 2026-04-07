function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
}

// Global error handler (always last middleware)
function errorHandler(err, req, res, next) {
  // Avoid double response
  // eslint-disable-next-line no-unused-vars
  const _ = next;

  const logger = require('../core/logger');
  const { Sequelize } = require('sequelize');
  const { AppError, ApiError } = require('../core/errors/AppError');

  if (err instanceof Sequelize.ForeignKeyConstraintError) {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn('Foreign key constraint', { message: err.message, index: err.index, table: err.table });
    }
    return res.status(400).json({
      message: 'Tham chiếu không hợp lệ (khóa ngoại): kiểm tra categoryId, locationId hoặc id liên quan.',
      code: 'FOREIGN_KEY_ERROR',
    });
  }

  const appErr = err instanceof AppError ? err : new ApiError({ statusCode: 500, message: 'Internal Server Error' });

  if (process.env.NODE_ENV !== 'test') {
    logger.error('Unhandled error', {
      message: appErr.message,
      statusCode: appErr.statusCode,
      code: appErr.code,
      details: appErr.details,
      stack: err?.stack,
    });
  }

  res.status(appErr.statusCode).json({
    message: appErr.message,
    ...(appErr.code ? { code: appErr.code } : {}),
    ...(appErr.details ? { details: appErr.details } : {}),
  });
}

module.exports = {
  ApiError: require('../core/errors/AppError').ApiError,
  notFound,
  errorHandler,
};
