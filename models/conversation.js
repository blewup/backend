'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.hasMany(models.ConversationParticipant, {
        foreignKey: 'conversation_id',
        as: 'participants'
      });
      Conversation.hasMany(models.ConversationMessage, {
        foreignKey: 'conversation_id',
        as: 'messages'
      });
      Conversation.belongsTo(models.ConversationMessage, {
        foreignKey: 'last_message_id',
        as: 'lastMessage'
      });
    }
  }
  
  Conversation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    conversation_type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
      defaultValue: 'direct'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'conversation_messages',
        key: 'id'
      }
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['conversation_type']
      },
      {
        fields: ['last_message_at']
      }
    ]
  });
  
  return Conversation;
};