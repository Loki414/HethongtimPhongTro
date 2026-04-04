module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    'Location',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      address: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'locations', underscored: true }
  );

  Location.associate = (models) => {
    Location.hasMany(models.Room, { foreignKey: 'locationId', as: 'rooms' });
  };

  return Location;
};
