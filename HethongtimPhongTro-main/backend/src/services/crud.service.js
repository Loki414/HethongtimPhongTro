const { Op } = require('sequelize');

async function list({ model, where = {}, page = 1, pageSize = 10, order = [['createdAt', 'DESC']], include = [] }) {
  const { count, rows } = await model.findAndCountAll({
    where,
    include,
    distinct: true,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order,
  });
  return {
    items: rows,
    meta: {
      total: count,
      page,
      pageSize,
      pageCount: Math.ceil(count / pageSize),
    },
  };
}

async function getById({ model, id, include = [] }) {
  return model.findByPk(id, { include });
}

async function create({ model, data }) {
  return model.create(data);
}

async function update({ model, id, data }) {
  const entity = await model.findByPk(id);
  if (!entity) return null;
  await entity.update(data);
  return entity;
}

async function destroy({ model, id }) {
  const entity = await model.findByPk(id);
  if (!entity) return false;
  await entity.destroy();
  return true;
}

module.exports = { list, getById, create, update, destroy };
