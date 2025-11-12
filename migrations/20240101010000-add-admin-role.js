'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('users').catch(() => null);

    if (!tableDefinition) {
      console.warn('⚠️  Skipping add_admin_role migration: users table not found');
      return;
    }

    if (!tableDefinition.is_admin) {
      await queryInterface.addColumn('users', 'is_admin', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('users').catch(() => null);

    if (!tableDefinition || !tableDefinition.is_admin) {
      return;
    }

    await queryInterface.removeColumn('users', 'is_admin');
  }
};
