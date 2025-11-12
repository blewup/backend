'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NPCLocation extends Model {
    static associate(models) {
      // Association with NPC
      this.belongsTo(models.NPC, {
        foreignKey: 'npc_id',
        as: 'npc'
      });
    }
  }

  NPCLocation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    npc_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'npcs',
        key: 'id'
      }
    },
    x_coord: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true
      }
    },
    y_coord: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true
      }
    },
    zone_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true
      }
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'NPCLocation',
    tableName: 'npc_locations',
    underscored: true,
    indexes: [
      {
        fields: ['npc_id', 'is_current']
      }
    ]
  });

  return NPCLocation;
};