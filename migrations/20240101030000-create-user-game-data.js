'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_game_data', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      ruks_balance: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0
      },
      inventory_slots: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 8
      },
      health: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 100
      },
      last_sleep: {
        type: Sequelize.DATE,
        allowNull: true
      },
      current_planet: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Earth'
      },
      last_coordinates: {
        type: Sequelize.JSON,
        allowNull: true
      },
      owned_weapons: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      active_effects: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_game_data');
  }
};
