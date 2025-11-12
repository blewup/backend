'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSocialProfile extends Model {
    static associate(models) {
      UserSocialProfile.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  UserSocialProfile.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    platform: { type: DataTypes.ENUM('Facebook','X','Instagram','Youtube','Twitch','Discord','Reddit','Linkedin','Github','TikTok','Snapchat','Pinterest','Telegram','Whatsapp','Xbox'), allowNull: true },
    profile_url: { type: DataTypes.STRING(500), allowNull: false },
    username: DataTypes.STRING(100),
    display_name: DataTypes.STRING(150),
    follower_count: DataTypes.INTEGER,
    is_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    sequelize,
    modelName: 'UserSocialProfile',
    tableName: 'social_',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['platform']
      },
      {
        fields: ['is_public']
      },
      {
        fields: ['username']
      }
    ]
  });
  return UserSocialProfile;
};