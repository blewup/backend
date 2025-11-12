'use strict';
const { Model } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  class PasswordResetToken extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    isExpired() {
      return new Date() > this.expires_at;
    }

    isUsed() {
      return this.used_at !== null;
    }

    async markAsUsed() {
      this.used_at = new Date();
      await this.save();
    }

    static async generateToken(userId) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      return await this.create({
        user_id: userId,
        token,
        expires_at: expiresAt
      });
    }

    static async validateAndUseToken(token) {
      const resetToken = await this.findOne({
        where: { token },
        include: ['user']
      });

      if (!resetToken || resetToken.isExpired() || resetToken.isUsed()) {
        return null;
      }

      await resetToken.markAsUsed();
      return resetToken;
    }
  }

  PasswordResetToken.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PasswordResetToken',
    tableName: 'password_reset_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['token'] },
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
      { fields: ['used_at'] }
    ]
  });

  return PasswordResetToken;
};
