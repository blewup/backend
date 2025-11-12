'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SupportResponse extends Model {
    static associate(models) {
      SupportResponse.belongsTo(models.SupportTicket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
      SupportResponse.belongsTo(models.User, {
        foreignKey: 'responder_id',
        as: 'responder'
      });
    }
  }
  
  SupportResponse.init({
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
    responder_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    response_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_internal_note: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'SupportResponse',
    tableName: 'support_responses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['ticket_id']
      },
      {
        fields: ['responder_id']
      }
    ]
  });
  
  return SupportResponse;
};