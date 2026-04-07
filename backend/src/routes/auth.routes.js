const express = require('express'); // Framework HTTP: tạo Router
const authController = require('../controllers/auth.controller'); // Handler auth (đăng ký, đăng nhập, quên/reset MK)

const router = express.Router(); // Router chỉ cho nhóm /api/auth

router.post('/register', ...authController.register); // POST /api/auth/register → validate body → tạo tài khoản
router.post('/login', ...authController.login); // POST /api/auth/login → validate body → trả JWT + user
router.post('/forgot-password', ...authController.forgotPassword); // Quên MK: tạo token (demo trả trong JSON)
router.post('/reset-password', ...authController.resetPassword); // Đặt lại MK bằng token còn hạn

module.exports = router; // app.js mount tại /api/auth
