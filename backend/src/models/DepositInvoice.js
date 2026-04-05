module.exports = (sequelize, DataTypes) => {
  const DepositInvoice = sequelize.define(
    'DepositInvoice',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'booking_id' },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      roomId: { type: DataTypes.UUID, allowNull: false, field: 'room_id' },
      invoiceCode: { type: DataTypes.STRING(40), allowNull: false, unique: true, field: 'invoice_code' },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      pricePerMonthSnapshot: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'price_per_month_snapshot' },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'deposit_invoices',
      underscored: true,
      timestamps: true,
    }
  );

  DepositInvoice.associate = (models) => {
    DepositInvoice.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
    DepositInvoice.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    DepositInvoice.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
  };

  return DepositInvoice;
};
