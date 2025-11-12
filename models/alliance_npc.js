'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AllianceNPC extends Model {
    static associate(models) {
      AllianceNPC.belongsTo(models.Alliance, {
        foreignKey: 'alliance_id',
        as: 'alliance'
      });
    }
  }

  AllianceNPC.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    alliance_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'alliances',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    role: {
      type: DataTypes.ENUM(
        'trader',
        'diplomat',
        'warrior',
        'scholar',
        'craftsman',
        'explorer',
        'spy',
        'guardian',
        'merchant',
        'advisor'
      ),
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 100
      }
    },
    specialization: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Sub-specialty within their role'
    },
    traits: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'NPC personality traits and characteristics'
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'NPC skills and their levels'
    },
    inventory: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'NPC current inventory and resources'
    },
    daily_tasks: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Tasks this NPC can perform daily'
    },
    relationship_scores: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'Relationship scores with alliance members'
    },
    interaction_history: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'History of significant interactions'
    },
    status: {
      type: DataTypes.ENUM('active', 'resting', 'busy', 'unavailable'),
      allowNull: false,
      defaultValue: 'active'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    last_interaction: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    next_available: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AllianceNPC',
    tableName: 'alliance_npcs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['alliance_id']
      },
      {
        fields: ['role']
      },
      {
        fields: ['level']
      },
      {
        fields: ['status']
      }
    ]
  });

  return AllianceNPC;
};