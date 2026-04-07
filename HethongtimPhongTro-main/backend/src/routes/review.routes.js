const express = require('express');
const reviewController = require('../controllers/review.controller');

const router = express.Router();

router.get('/', ...reviewController.list);
router.get('/:reviewId', ...reviewController.getById);
router.post('/', ...reviewController.create);
router.put('/:reviewId', ...reviewController.update);
router.delete('/:reviewId', ...reviewController.remove);

module.exports = router;
