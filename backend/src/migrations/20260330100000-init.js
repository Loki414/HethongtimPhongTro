/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      full_name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
      avatar_url: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Categories
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Locations
    await queryInterface.createTable('locations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Amenities
    await queryInterface.createTable('amenities', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Room amenities join (n-n)
    await queryInterface.createTable('room_amenities', {
      room_id: { type: Sequelize.UUID, primaryKey: true },
      amenity_id: { type: Sequelize.UUID, primaryKey: true },
    });

    // Rooms
    await queryInterface.createTable('rooms', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      price_per_month: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      area_sqm: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      address: { type: Sequelize.STRING(255), allowNull: true },
      category_id: { type: Sequelize.UUID, allowNull: false },
      location_id: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Bookings
    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      room_id: { type: Sequelize.UUID, allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'confirmed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
      note: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Reviews
    await queryInterface.createTable('reviews', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      room_id: { type: Sequelize.UUID, allowNull: false },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Images
    await queryInterface.createTable('images', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      room_id: { type: Sequelize.UUID, allowNull: false },
      url: { type: Sequelize.STRING(1000), allowNull: false },
      file_name: { type: Sequelize.STRING(255), allowNull: true },
      mime_type: { type: Sequelize.STRING(120), allowNull: true },
      size_bytes: { type: Sequelize.BIGINT, allowNull: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Favorites
    await queryInterface.createTable('favorites', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      room_id: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Reports
    await queryInterface.createTable('reports', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      reporter_id: { type: Sequelize.UUID, allowNull: false },
      room_id: { type: Sequelize.UUID, allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('open', 'resolved'), allowNull: false, defaultValue: 'open' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Foreign keys
    await queryInterface.addConstraint('rooms', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'rooms_user_fk',
      references: { table: 'users', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('rooms', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'rooms_category_fk',
      references: { table: 'categories', fields: ['id'] },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('rooms', {
      fields: ['location_id'],
      type: 'foreign key',
      name: 'rooms_location_fk',
      references: { table: 'locations', fields: ['id'] },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('room_amenities', {
      fields: ['room_id'],
      type: 'foreign key',
      name: 'room_amenities_room_fk',
      references: { table: 'rooms', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('room_amenities', {
      fields: ['amenity_id'],
      type: 'foreign key',
      name: 'room_amenities_amenity_fk',
      references: { table: 'amenities', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('bookings', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'bookings_user_fk',
      references: { table: 'users', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('bookings', {
      fields: ['room_id'],
      type: 'foreign key',
      name: 'bookings_room_fk',
      references: { table: 'rooms', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('reviews', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'reviews_user_fk',
      references: { table: 'users', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('reviews', {
      fields: ['room_id'],
      type: 'foreign key',
      name: 'reviews_room_fk',
      references: { table: 'rooms', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('images', {
      fields: ['room_id'],
      type: 'foreign key',
      name: 'images_room_fk',
      references: { table: 'rooms', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('favorites', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'favorites_user_fk',
      references: { table: 'users', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('favorites', {
      fields: ['room_id'],
      type: 'foreign key',
      name: 'favorites_room_fk',
      references: { table: 'rooms', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('reports', {
      fields: ['reporter_id'],
      type: 'foreign key',
      name: 'reports_reporter_fk',
      references: { table: 'users', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('reports', {
      fields: ['room_id'],
      type: 'foreign key',
      name: 'reports_room_fk',
      references: { table: 'rooms', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Composite uniqueness: favorites uniqueness & (optional) single review per user+room
    await queryInterface.addIndex('favorites', ['user_id', 'room_id'], { unique: true, name: 'favorites_user_room_unique' });
    await queryInterface.addIndex('reviews', ['user_id', 'room_id'], { unique: false, name: 'reviews_user_room_idx' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('room_amenities');
    await queryInterface.dropTable('bookings');
    await queryInterface.dropTable('reviews');
    await queryInterface.dropTable('images');
    await queryInterface.dropTable('favorites');
    await queryInterface.dropTable('reports');
    await queryInterface.dropTable('rooms');
    await queryInterface.dropTable('amenities');
    await queryInterface.dropTable('locations');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('users');
  },
};

