const express = require('express');
const bookingController = require('../controllers/booking.controller');

const router = express.Router();

router.get('/', ...bookingController.list);
router.get('/:bookingId', ...bookingController.getById);
router.post('/', ...bookingController.create);
router.put('/:bookingId', ...bookingController.update);
router.delete('/:bookingId', ...bookingController.remove);

module.exports = router;
