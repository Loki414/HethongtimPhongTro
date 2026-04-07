const { ValidationError } = require('../core/errors/AppError'); // Lỗi 400 kèm chi tiết Zod cho client

// Middleware dùng chung cho đăng ký/đăng nhập: validate({ body: loginSchema }) trước handler
// Usage: router.post('/', validate({ body: schema }), handler)
function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body); // Parse + ép kiểu theo Zod; sai format → throw
      }
      if (query) {
        req.query = query.parse(req.query); // (Không dùng trong auth routes hiện tại)
      }
      if (params) {
        req.params = params.parse(req.params); // (Không dùng trong auth routes hiện tại)
      }
      return next(); // Hợp lệ → chuyển sang controller/service
    } catch (err) {
      // zod error format
      const details = err?.issues || err?.errors; // Danh sách lỗi từng field
      return next(new ValidationError('Validation error', details)); // errorHandler trả JSON thống nhất
    }
  };
}

module.exports = { validate };
