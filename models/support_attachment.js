'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SupportAttachment extends Model {
    static associate(models) {
      SupportAttachment.belongsTo(models.SupportTicket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
    }
  }
  
  SupportAttachment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'support_tickets',
        key: 'id'
      }
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_data: {
      type: DataTypes.BLOB('long'),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'SupportAttachment',
    tableName: 'support_attachments',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['ticket_id']
      }
    ]
  });
  
  return SupportAttachment;
};