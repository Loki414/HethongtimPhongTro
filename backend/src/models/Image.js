module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define(
    'Image',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      roomId: { type: DataTypes.UUID, allowNull: false, field: 'room_id' },
      url: { type: DataTypes.STRING(1000), allowNull: false },
      fileName: { type: DataTypes.STRING(255), allowNull: true, field: 'file_name' },
      mimeType: { type: DataTypes.STRING(120), allowNull: true, field: 'mime_type' },
      sizeBytes: { type: DataTypes.BIGINT, allowNull: true, field: 'size_bytes' },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
    },
    { tableName: 'images', underscored: true, paranoid: true, deletedAt: 'deleted_at' }
  );

  Image.associate = (models) => {
    Image.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
  };

  return Image;
};
