module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      roomId: { type: DataTypes.UUID, allowNull: false, field: 'room_id' },
      startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
      endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      note: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'bookings', underscored: true, paranoid: true, deletedAt: 'deleted_at' }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Booking.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
  };

  return Booking;
};
