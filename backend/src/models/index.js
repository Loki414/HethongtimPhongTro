const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(dbConfig[env]);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Room = require('./Room')(sequelize, Sequelize.DataTypes);
const Category = require('./Category')(sequelize, Sequelize.DataTypes);
const Location = require('./Location')(sequelize, Sequelize.DataTypes);
const Booking = require('./Booking')(sequelize, Sequelize.DataTypes);
const Review = require('./Review')(sequelize, Sequelize.DataTypes);
const Image = require('./Image')(sequelize, Sequelize.DataTypes);
const Amenity = require('./Amenity')(sequelize, Sequelize.DataTypes);
const Favorite = require('./Favorite')(sequelize, Sequelize.DataTypes);
const Report = require('./Report')(sequelize, Sequelize.DataTypes);
const RoomAmenity = require('./RoomAmenity')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);

// Associations
const models = {
  User,
  Room,
  Category,
  Location,
  Booking,
  Review,
  Image,
  Amenity,
  Favorite,
  Report,
  RoomAmenity,
  Notification,
};

Object.values(models).forEach((m) => {
  if (typeof m.associate === 'function') m.associate(models);
});

module.exports = {
  sequelize,
  Sequelize,
  ...models,
};
