module.exports = (sequelize, DataTypes) => {
  const Amenity = sequelize.define(
    'Amenity',
    {
      id: { type: DataTypes.UUID, defaultValue: sequelize.literal('UUID()'), primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    },
    { tableName: 'amenities', underscored: true }
  );

  Amenity.associate = (models) => {
    Amenity.belongsToMany(models.Room, {
      through: models.RoomAmenity,
      foreignKey: 'amenityId',
      otherKey: 'roomId',
      as: 'rooms',
    });
  };

  return Amenity;
};
