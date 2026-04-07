const crypto = require('crypto'); // Sinh token reset ngẫu nhiên (bản nhanh)
const { Op } = require('sequelize'); // So sánh hết hạn token (password_reset_expires > now)
const jwt = require('jsonwebtoken'); // Ký và tạo chuỗi JWT sau khi đăng nhập thành công
const { ApiError } = require('../middlewares/errorHandler'); // Lỗi có mã HTTP thống nhất (401, 409, 500)
const { User } = require('../models'); // Model Sequelize User (bảng users)

async function register({ fullName, email, password, role }) {
  const existing = await User.findOne({ where: { email } }); // Kiểm tra email đã tồn tại chưa
  if (existing) throw new ApiError(409, 'Email already exists'); // Trùng email → 409 Conflict

  const user = User.build({ fullName, email, role: role || 'user' }); // Tạo instance chưa lưu DB; mặc định role user
  await user.setPassword(password); // Băm mật khẩu (bcrypt) và gán vào passwordHash
  await user.save(); // INSERT vào bảng users

  return {
    // Trả về thông tin hiển thị (không trả passwordHash, không phát JWT — chỉ sau login)
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } }); // Tìm user theo email
  if (!user) throw new ApiError(401, 'Invalid credentials'); // Không tồn tại → không tiết lộ chi tiết

  const ok = await user.validatePassword(password); // So sánh mật khẩu thô với passwordHash (bcrypt.compare)
  if (!ok) throw new ApiError(401, 'Invalid credentials'); // Sai mật khẩu → cùng message với case trên

  const secret = process.env.JWT_SECRET; // Khóa bí mật để ký token (bắt buộc cấu hình)
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured'); // Thiếu env → lỗi server

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email }, // Payload JWT: id user, role, email
    secret, // Ký bằng JWT_SECRET
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Hết hạn: từ env hoặc mặc định 7 ngày
  );

  return {
    token, // Chuỗi Bearer dùng cho các request cần xác thực
    user: {
      // Bản sao thông tin user an toàn cho client (không có hash mật khẩu)
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  };
}

/** Bước 1 quên mật khẩu: tìm user theo email, ghi token + thời hạn; bản nhanh trả token trong JSON (không gửi email). */
async function forgotPassword({ email }) {
  const genericMessage =
    'Nếu email đã đăng ký, bạn có thể dùng mã đặt lại (bản demo hiển thị mã bên dưới).'; // Luôn cùng message để hạn chế lộ email tồn tại
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return { message: genericMessage }; // Không có user: không trả token (kẻ tấn công vẫn có thể đoán qua có/không field — production dùng email)
  }

  const plainToken = crypto.randomBytes(32).toString('hex'); // Token khó đoán, 64 ký tự hex
  user.passwordResetToken = plainToken; // Lưu DB (demo lưu thô; production nên lưu hash của token)
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // Hết hạn sau 1 giờ
  await user.save();

  return {
    message: genericMessage,
    resetToken: plainToken, // Chỉ bản nhanh: client copy để gọi reset-password (thật sự sẽ gửi link qua email)
    expiresAt: user.passwordResetExpires,
  };
}

/** Bước 2: đổi mật khẩu bằng token còn hạn, rồi xóa token để không dùng lại. */
async function resetPassword({ token, password }) {
  const user = await User.findOne({
    where: {
      passwordResetToken: token, // Khớp token đã lưu
      passwordResetExpires: { [Op.gt]: new Date() }, // Chưa hết hạn
    },
  });
  if (!user) throw new ApiError(400, 'Token không hợp lệ hoặc đã hết hạn');

  await user.setPassword(password); // Hash mật khẩu mới
  user.passwordResetToken = null; // Vô hiệu hóa token
  user.passwordResetExpires = null;
  await user.save();

  return { message: 'Đã đặt lại mật khẩu. Vui lòng đăng nhập.' };
}

module.exports = { register, login, forgotPassword, resetPassword };
