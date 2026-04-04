const express = require('express');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.get('/unread-count', ...notificationController.unreadCount);
router.post('/read-all', ...notificationController.markAllRead);
router.get('/', ...notificationController.list);
router.patch('/:notificationId/read', ...notificationController.markRead);

module.exports = router;
