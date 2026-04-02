const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.get('/me', ...userController.me);
router.patch('/me/avatar', ...userController.updateAvatar);

// Admin CRUD
router.get('/', ...userController.adminList);
router.put('/:id', ...userController.adminUpdate);
router.delete('/:id', ...userController.adminDelete);

module.exports = router;
