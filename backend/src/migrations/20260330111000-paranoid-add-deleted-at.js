/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = ['rooms', 'bookings', 'reviews', 'favorites', 'reports', 'images'];
    for (const table of tables) {
      await queryInterface.addColumn(table, 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // Soft delete on favorites requires removing UNIQUE (user_id, room_id),
    // otherwise creating a new favorite after unfavorite will fail.
    await queryInterface.removeIndex('favorites', 'favorites_user_room_unique').catch(() => {});
    await queryInterface.addIndex('favorites', ['user_id', 'room_id'], {
      name: 'favorites_user_room_idx',
    });

    await queryInterface.addIndex('rooms', ['location_id'], { name: 'rooms_location_idx' }).catch(() => {});
    await queryInterface.addIndex('rooms', ['category_id'], { name: 'rooms_category_idx' }).catch(() => {});
    await queryInterface.addIndex('rooms', ['price_per_month'], { name: 'rooms_price_idx' }).catch(() => {});
  },

  async down(queryInterface) {
    const tables = ['rooms', 'bookings', 'reviews', 'favorites', 'reports', 'images'];
    for (const table of tables) {
      await queryInterface.removeColumn(table, 'deleted_at').catch(() => {});
    }
    await queryInterface.removeIndex('favorites', 'favorites_user_room_idx').catch(() => {});
  },
};

