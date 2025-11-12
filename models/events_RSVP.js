'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventRSVP extends Model {
    static associate(models) {
      // Link RSVPs back to their event and user owners
      this.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event'
      });
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  EventRSVP.init({
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
    response: {
      type: DataTypes.ENUM('attending', 'interested', 'not_attending'),
      allowNull: false,
      defaultValue: 'interested'
    }
  }, {
    sequelize,
    modelName: 'EventRSVP',
    tableName: 'event_rsvps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['event_id'] },
      { fields: ['user_id'] },
      { fields: ['response'] },
      { unique: true, fields: ['event_id', 'user_id'] }
    ]
  });

  return EventRSVP;
};
