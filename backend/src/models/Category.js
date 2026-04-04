module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'categories', underscored: true }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Room, { foreignKey: 'categoryId', as: 'rooms' });
  };

  return Category;
};
