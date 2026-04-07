/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'phone').catch(() => {});
  },
};
