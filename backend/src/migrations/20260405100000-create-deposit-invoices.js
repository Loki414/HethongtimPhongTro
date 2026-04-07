/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deposit_invoices', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('(UUID())'), primaryKey: true },
      booking_id: { type: Sequelize.UUID, allowNull: false, unique: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      room_id: { type: Sequelize.UUID, allowNull: false },
      invoice_code: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      price_per_month_snapshot: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('deposit_invoices', {
      fields: ['booking_id'],
      type: 'foreign key',
      name: 'deposit_invoices_booking_fk',
      references: { table: 'bookings', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('deposit_invoices', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'deposit_invoices_user_fk',
      references: { table: 'users', fields: ['id'] },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('deposit_invoices', {
      fields: ['room_id'],
      type: 'foreign key',
      name: 'deposit_invoices_room_fk',
      references: { table: 'rooms', fields: ['id'] },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex('deposit_invoices', ['user_id', 'created_at'], {
      name: 'deposit_invoices_user_created_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('deposit_invoices');
  },
};
