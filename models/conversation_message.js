'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConversationMessage extends Model {
    static associate(models) {
      ConversationMessage.belongsTo(models.Conversation, {
        foreignKey: 'conversation_id',
        as: 'conversation'
      });
      ConversationMessage.belongsTo(models.User, {
        foreignKey: 'sender_id',
        as: 'sender'
      });
      ConversationMessage.hasOne(models.Conversation, {
        foreignKey: 'last_message_id',
        as: 'conversationLastMessage'
      });
    }
  }
  
  ConversationMessage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id'
      }
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    edited_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ConversationMessage',
    tableName: 'conversation_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['conversation_id']
      },
      {
        fields: ['sender_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['is_read']
      }
    ]
  });
  
  return ConversationMessage;
};