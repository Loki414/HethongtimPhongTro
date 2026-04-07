module.exports = (sequelize, DataTypes) => {
  const RoomAmenity = sequelize.define(
    'RoomAmenity',
    {
      roomId: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: 'room_id',
      },
      amenityId: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: 'amenity_id',
      },
    },
    {
      tableName: 'room_amenities',
      timestamps: false,
      underscored: true,
    }
  );

  RoomAmenity.associate = () => {};

  return RoomAmenity;
};
