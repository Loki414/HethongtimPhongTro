/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rooms', 'status', {
      type: Sequelize.ENUM('available', 'rented'),
      allowNull: false,
      defaultValue: 'available',
    });

    await queryInterface.addIndex('rooms', ['status'], { name: 'rooms_status_idx' }).catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('rooms', 'rooms_status_idx').catch(() => {});
    await queryInterface.removeColumn('rooms', 'status').catch(() => {});
  },
};

