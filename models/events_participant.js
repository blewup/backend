'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventsParticipant extends Model {
    static associate(models) {
      EventsParticipant.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event'
      });
      EventsParticipant.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  
  EventsParticipant.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'events',
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
    registration_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    attendance_status: {
      type: DataTypes.ENUM('registered', 'confirmed', 'attended', 'cancelled', 'no_show'),
      allowNull: false,
      defaultValue: 'registered'
    }
  }, {
    sequelize,
    modelName: 'EventsParticipant',
    tableName: 'event_participants',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['event_id', 'user_id']
      },
      {
        fields: ['event_id']
      },
      {
        fields: ['user_id']
      }
    ]
  });
  
  return EventsParticipant;
};