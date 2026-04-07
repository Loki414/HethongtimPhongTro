const express = require('express');
const imageController = require('../controllers/image.controller');

const router = express.Router();

router.get('/', ...imageController.list);
router.get('/:imageId', ...imageController.getById);
router.post('/', ...imageController.create);
router.put('/:imageId', ...imageController.update);
router.delete('/:imageId', ...imageController.remove);

module.exports = router;
