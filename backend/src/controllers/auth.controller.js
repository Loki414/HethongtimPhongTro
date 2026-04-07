const { z } = require('zod'); // Thư viện Zod: định nghĩa schema và validate dữ liệu đầu vào
const authService = require('../services/auth.service'); // Gọi logic nghiệp vụ đăng ký / đăng nhập / quên mật khẩu
const { validate } = require('../middlewares/validate'); // Middleware: parse + kiểm tra body theo schema

const registerSchema = z.object({
  // Schema cho body POST /register
  fullName: z.string().min(2), // Họ tên: chuỗi, tối thiểu 2 ký tự
  email: z.string().email(), // Email đúng định dạng
  password: z.string().min(6), // Mật khẩu tối thiểu 6 ký tự
  role: z.enum(['admin', 'user']).optional(), // Vai trò (tuỳ chọn), chỉ admin hoặc user
});

const loginSchema = z.object({
  // Schema cho body POST /login
  email: z.string().email(), // Email hợp lệ
  password: z.string().min(1), // Mật khẩu không được rỗng
});

// Body POST /forgot-password — chỉ cần email đã đăng ký
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Body POST /reset-password — token từ bước forgot + mật khẩu mới
const resetPasswordSchema = z.object({
  token: z.string().min(32), // Token hex 32 byte = 64 ký tự; min 32 để tránh nhập bừa quá ngắn
  password: z.string().min(6),
});

const register = [
  validate({ body: registerSchema }), // Chạy trước handler: gán req.body đã được parse/validate
  async (req, res) => {
    const data = await authService.register(req.body); // Tạo user mới trong DB (không trả JWT ở service)
    res.status(201).json({ message: 'Registered', data }); // 201 Created + message + payload user (không có token ở đây)
  },
];

const login = [
  validate({ body: loginSchema }), // Validate email + password trước khi vào handler
  async (req, res) => {
    const data = await authService.login(req.body); // Tìm user, kiểm tra mật khẩu, ký JWT
    res.json({ message: 'Logged in', data }); // 200 + { token, user } trong data
  },
];

const forgotPassword = [
  validate({ body: forgotPasswordSchema }),
  async (req, res) => {
    const data = await authService.forgotPassword(req.body); // Tạo token reset (nếu email có user)
    res.json({ message: data.message, data }); // data có thể có resetToken + expiresAt (bản demo)
  },
];

const resetPassword = [
  validate({ body: resetPasswordSchema }),
  async (req, res) => {
    const data = await authService.resetPassword(req.body); // Đổi mật khẩu và xóa token
    res.json({ message: data.message, data });
  },
];

module.exports = { register, login, forgotPassword, resetPassword };
