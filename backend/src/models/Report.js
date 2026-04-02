module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    'Report',
    {
      id: { type: DataTypes.UUID, defaultValue: sequelize.literal('UUID()'), primaryKey: true },
      reporterId: { type: DataTypes.UUID, allowNull: false, field: 'reporter_id' },
      roomId: { type: DataTypes.UUID, allowNull: false, field: 'room_id' },
      reason: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM('open', 'resolved'),
        allowNull: false,
        defaultValue: 'open',
      },
    },
    { tableName: 'reports', underscored: true, timestamps: true, paranoid: true, deletedAt: 'deleted_at' }
  );

  Report.associate = (models) => {
    Report.belongsTo(models.User, { foreignKey: 'reporterId', as: 'reporter' });
    Report.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
  };

  return Report;
};
