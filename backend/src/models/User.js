const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
      avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      tableName: 'users',
      underscored: true,
    }
  );

  // Hash password before saving.
  User.prototype.setPassword = async function setPassword(password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    this.passwordHash = hash;
  };

  User.prototype.validatePassword = async function validatePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
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
