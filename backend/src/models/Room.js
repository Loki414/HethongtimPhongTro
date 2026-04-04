module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define(
    'Room',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      pricePerMonth: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      areaSqm: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      address: { type: DataTypes.STRING(255), allowNull: true },
      status: {
        type: DataTypes.ENUM('available', 'rented'),
        allowNull: false,
        defaultValue: 'available',
      },
      categoryId: { type: DataTypes.UUID, allowNull: false, field: 'category_id' },
      locationId: { type: DataTypes.UUID, allowNull: false, field: 'location_id' },
    },
    {
      tableName: 'rooms',
      underscored: true,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  Room.associate = (models) => {
    Room.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
    Room.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    Room.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });

    Room.hasMany(models.Booking, { foreignKey: 'roomId', as: 'bookings' });
    Room.hasMany(models.Review, { foreignKey: 'roomId', as: 'reviews' });
    Room.hasMany(models.Image, { foreignKey: 'roomId', as: 'images' });
    Room.hasMany(models.Favorite, { foreignKey: 'roomId', as: 'favorites' });
    Room.hasMany(models.Report, { foreignKey: 'roomId', as: 'reports' });

    // Many-to-many with Amenity via room_amenities join table
    Room.belongsToMany(models.Amenity, {
      through: models.RoomAmenity,
      foreignKey: 'roomId',
      otherKey: 'amenityId',
      as: 'amenities',
    });
  };

  return Room;
};
