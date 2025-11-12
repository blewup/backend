'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserGameData extends Model {
    static associate(models) {
      UserGameData.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  UserGameData.init({
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    ruks_balance: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    inventory_slots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 8,
      validate: {
        min: 8,
        max: 72
      }
    },
    health: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 100
      }
    },
    last_sleep: {
      type: DataTypes.DATE,
      allowNull: true
    },
    current_planet: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Earth'
    },
    last_coordinates: {
      type: DataTypes.JSON,
      allowNull: true
    },
    owned_weapons: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    active_effects: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'UserGameData',
    tableName: 'user_game_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate: (data) => {
        data.updated_at = new Date();
      }
    }
  });

  return UserGameData;
};