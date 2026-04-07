const { ValidationError } = require('../core/errors/AppError');

// Factory: validate request body/query/params using a zod schema.
// Usage: router.post('/', validate({ body: schema }), handler)
function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      return next();
    } catch (err) {
      // zod error format
      const details = err?.issues || err?.errors;
      return next(new ValidationError('Validation error', details));
    }
  };
}

module.exports = { validate };
