const express = require('express');
const { z } = require('zod');

const { Category } = require('../models');
const { makeCrudController } = require('../controllers/crud.controllerFactory');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

const crud = makeCrudController({
  model: Category,
  createSchema: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
  }),
  updateSchema: z
    .object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
    })
    .partial(),
});

router.get('/', ...crud.list);
router.get('/:id', ...crud.getById);
router.post('/', requireAuth, requireRole('admin'), ...crud.create);
router.put('/:id', requireAuth, requireRole('admin'), ...crud.update);
router.delete('/:id', requireAuth, requireRole('admin'), ...crud.destroy);

module.exports = router;
