const bcrypt = require('bcrypt'); // Dùng cho đăng ký (hash) và đăng nhập (so sánh)

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID, // Khóa chính dạng UUID
        defaultValue: DataTypes.UUIDV4, // Sinh id tự động khi tạo bản ghi
        primaryKey: true,
      },
      fullName: { type: DataTypes.STRING(120), allowNull: false }, // Họ tên bắt buộc (đăng ký)
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true }, // Email duy nhất — dùng để login
      phone: { type: DataTypes.STRING(20), allowNull: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false }, // Lưu bcrypt hash, không lưu mật khẩu thô
      role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' }, // Phân quyền, JWT cũng mang role
      avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
      // Quên mật khẩu (bản demo): token thô + hết hạn; production nên hash token và gửi link qua email
      passwordResetToken: { type: DataTypes.STRING(128), allowNull: true },
      passwordResetExpires: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'users', // Tên bảng thật trong DB
      underscored: true, // Cột snake_case (password_hash, …)
    }
  );

  // Luồng đăng ký: gọi trước save() để gán passwordHash từ mật khẩu người dùng nhập
  User.prototype.setPassword = async function setPassword(password) {
    const saltRounds = 10; // Độ “mặn” bcrypt (càng cao càng chậm, an toàn hơn)
    const hash = await bcrypt.hash(password, saltRounds); // Băm mật khẩu một chiều
    this.passwordHash = hash; // Gán vào instance; save() sẽ ghi xuống DB
  };

  // Luồng đăng nhập: so sánh mật khẩu form với hash đã lưu
  User.prototype.validatePassword = async function validatePassword(password) {
    return bcrypt.compare(password, this.passwordHash); // true nếu khớp
  };

  User.associate = (models) => {
    User.hasMany(models.Room, { foreignKey: 'userId', as: 'rooms' });
    User.hasMany(models.Booking, { foreignKey: 'userId', as: 'bookings' });
    User.hasMany(models.Review, { foreignKey: 'userId', as: 'reviews' });
    User.hasMany(models.Favorite, { foreignKey: 'userId', as: 'favorites' });
    User.hasMany(models.Report, { foreignKey: 'reporterId', as: 'reports' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  };

  return User;
};
