const { z } = require('zod');
const { ApiError } = require('../middlewares/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const crudService = require('../services/crud.service');
const { validate } = require('../middlewares/validate');

function makeCrudController({
  model,
  listInclude = [],
  getInclude = [],
  idParamName = 'id',
  // Build where clause based on req (e.g. user ownership).
  buildListWhere = () => ({}),
  buildGetWhere = () => ({}),
  // Permission hooks
  canCreate = () => true,
  canUpdate = () => true,
  canDelete = () => true,
  // Body schemas (zod)
  createSchema = z.any(),
  updateSchema = z.any(),
  // Optional query schema for pagination
  querySchema = z
    .object({
      page: z.coerce.number().int().min(1).optional().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
    })
    .catchall(z.any()),
}) {
  const idSchema = z.object({
    [idParamName]: z.string().uuid(),
  });

  async function list(req, res) {
    const { page, pageSize } = req.query;
    const where = { ...buildListWhere(req) };
    const result = await crudService.list({
      model,
      where,
      page,
      pageSize,
      include: listInclude,
    });
    res.json({ message: 'OK', ...result });
  }

  async function getById(req, res) {
    const where = buildGetWhere(req);
    // findByPk ignores where; so we do a guarded findOne if where is provided.
    let entity = null;
    if (where && Object.keys(where).length > 0) {
      entity = await model.findOne({ where: { ...where, [model.primaryKeyAttribute]: req.params[idParamName] }, include: getInclude });
    } else {
      entity = await crudService.getById({ model, id: req.params[idParamName], include: getInclude });
    }
    if (!entity) throw new ApiError(404, 'Not found');
    res.json({ message: 'OK', data: entity });
  }

  async function create(req, res) {
    if (!canCreate(req)) throw new ApiError(403, 'Forbidden');
    const entity = await crudService.create({ model, data: req.body });
    res.status(201).json({ message: 'Created', data: entity });
  }

  async function update(req, res) {
    const entity = await model.findByPk(req.params[idParamName]);
    if (!entity) throw new ApiError(404, 'Not found');
    if (!canUpdate(req, entity)) throw new ApiError(403, 'Forbidden');

    await entity.update(req.body);
    res.json({ message: 'Updated', data: entity });
  }

  async function destroy(req, res) {
    const entity = await model.findByPk(req.params[idParamName]);
    if (!entity) throw new ApiError(404, 'Not found');
    if (!canDelete(req, entity)) throw new ApiError(403, 'Forbidden');
    await entity.destroy();
    res.json({ message: 'Deleted' });
  }

  return {
    list: [validate({ query: querySchema }), asyncHandler(list)],
    getById: [validate({ params: idSchema }), asyncHandler(getById)],
    create: [validate({ body: createSchema }), asyncHandler(create)],
    update: [validate({ params: idSchema }), validate({ body: updateSchema }), asyncHandler(update)],
    destroy: [validate({ params: idSchema }), asyncHandler(destroy)],
  };
}

module.exports = { makeCrudController };
