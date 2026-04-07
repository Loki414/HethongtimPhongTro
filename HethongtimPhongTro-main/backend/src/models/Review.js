module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    'Review',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      roomId: { type: DataTypes.UUID, allowNull: false, field: 'room_id' },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'reviews', underscored: true, paranoid: true, deletedAt: 'deleted_at' }
  );

  Review.associate = (models) => {
    Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Review.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
  };

  return Review;
};
