class AppError extends Error {
  constructor(arg1 = {}, arg2, arg3) {
    // Backward-compatible:
    // 1) new ApiError(404, 'Not found')
    // 2) new ApiError({ statusCode: 404, message: 'Not found', code: 'NOT_FOUND', details })
    const payload =
      typeof arg1 === 'object' && arg1 !== null
        ? arg1
        : {
            statusCode: typeof arg1 === 'number' ? arg1 : 500,
            message: typeof arg2 === 'string' ? arg2 : 'Internal Server Error',
            details: arg3,
          };

    const { statusCode = 500, message = 'Internal Server Error', code = 'INTERNAL_ERROR', details } = payload;
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  toJSON() {
    const payload = {
      message: this.message,
      code: this.code,
    };
    if (this.details) payload.details = this.details;
    return payload;
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', details) {
    super({ statusCode: 400, message, code: 'VALIDATION_ERROR', details });
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details) {
    super({ statusCode: 401, message, code: 'UNAUTHORIZED', details });
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details) {
    super({ statusCode: 403, message, code: 'FORBIDDEN', details });
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found', details) {
    super({ statusCode: 404, message, code: 'NOT_FOUND', details });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super({ statusCode: 409, message, code: 'CONFLICT', details });
  }
}

// Backward-compatible name used in existing code
class ApiError extends AppError {}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ApiError,
};

