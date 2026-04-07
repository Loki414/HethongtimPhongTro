const express = require('express');
const depositInvoiceController = require('../controllers/depositInvoice.controller');

const router = express.Router();

router.post('/issue/:bookingId', ...depositInvoiceController.issueForBooking);
router.post('/:depositInvoiceId/resend-notification', ...depositInvoiceController.resendNotification);
router.patch('/:depositInvoiceId', ...depositInvoiceController.patchAdmin);
router.get('/', ...depositInvoiceController.list);
router.get('/:depositInvoiceId', ...depositInvoiceController.getById);

module.exports = router;
