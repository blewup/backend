'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NPCInteraction extends Model {
    static associate(models) {
      // Association with NPC
      this.belongsTo(models.NPC, {
        foreignKey: 'npc_id',
        as: 'npc'
      });

      // Association with User
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    // Helper method to summarize interaction
    summarize() {
      return {
        type: this.interaction_type,
        timestamp: this.created_at,
        data: this.interaction_data,
        result: this.result
      };
    }

    // Helper method to check if interaction was successful
    isSuccessful() {
      return this.result && this.result.success === true;
    }

    // Helper method to get interaction duration
    getDuration() {
      if (this.interaction_data && this.interaction_data.start_time) {
        const startTime = new Date(this.interaction_data.start_time).getTime();
        const endTime = this.created_at.getTime();
        return Math.round((endTime - startTime) / 1000); // Duration in seconds
      }
      return 0;
    }
  }

  NPCInteraction.init({
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    interaction_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['TALK', 'TRADE', 'QUEST', 'TRAIN', 'BATTLE', 'SERVICE']]
      }
    },
    interaction_data: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidInteractionData(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Interaction data must be an object');
          }
        }
      }
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidResult(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Result must be an object');
          }
          if (value && typeof value.success !== 'boolean') {
            throw new Error('Result must include a success boolean');
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'NPCInteraction',
    tableName: 'npc_interactions',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['npc_id', 'user_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return NPCInteraction;
};