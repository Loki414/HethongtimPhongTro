/* eslint-disable no-unused-vars */
'use strict';

/** Bản nhanh: lưu token đặt lại mật khẩu + thời điểm hết hạn (production nên gửi token qua email, có thể hash token trong DB). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'password_reset_token', {
      type: Sequelize.STRING(128),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'password_reset_expires', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'password_reset_expires').catch(() => {});
    await queryInterface.removeColumn('users', 'password_reset_token').catch(() => {});
  },
};
