'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserLocation extends Model {
    static associate(models) {
      UserLocation.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  UserLocation.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    address_type: { type: DataTypes.ENUM('home', 'work', 'billing', 'shipping', 'other'), allowNull: false, defaultValue: 'home' },
    street_address: DataTypes.STRING,
    street_address_2: DataTypes.STRING,
    city: DataTypes.STRING(100),
    state_province: DataTypes.STRING(100),
    postal_code: DataTypes.STRING(20),
    country: DataTypes.STRING(100),
    country_code: DataTypes.CHAR(2),
    latitude: DataTypes.DECIMAL(10, 8),
    longitude: DataTypes.DECIMAL(11, 8),
    timezone: DataTypes.STRING(50),
    is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    sequelize,
    modelName: 'UserLocation',
    tableName: 'user_locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return UserLocation;
};