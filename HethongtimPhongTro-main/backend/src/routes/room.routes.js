const express = require('express');
const roomController = require('../controllers/room.controller');

const router = express.Router();

router.get('/', ...roomController.list);
router.get('/:roomId', ...roomController.getById);
router.post('/', ...roomController.create);
router.put('/:roomId', ...roomController.update);
router.delete('/:roomId', ...roomController.remove);
router.post('/:roomId/images', ...roomController.uploadImages);

module.exports = router;
