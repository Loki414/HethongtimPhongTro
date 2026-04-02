module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define(
    'Favorite',
    {
      id: { type: DataTypes.UUID, defaultValue: sequelize.literal('UUID()'), primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      roomId: { type: DataTypes.UUID, allowNull: false, field: 'room_id' },
    },
    {
      tableName: 'favorites',
      underscored: true,
      timestamps: true,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  Favorite.associate = (models) => {
    Favorite.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Favorite.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
  };

  return Favorite;
};
