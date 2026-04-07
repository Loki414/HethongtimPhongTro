const express = require('express');
const favoriteController = require('../controllers/favorite.controller');

const router = express.Router();

router.get('/', ...favoriteController.list);
router.get('/:favoriteId', ...favoriteController.getById);
router.post('/', ...favoriteController.create);
router.put('/:favoriteId', ...favoriteController.update);
router.delete('/:favoriteId', ...favoriteController.remove);

module.exports = router;
