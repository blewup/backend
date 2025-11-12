'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserActivity extends Model {
    static associate(models) {
      // Belongs to User
      UserActivity.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      // Optional: Related user (for friend activities, etc.)
      UserActivity.belongsTo(models.User, {
        foreignKey: 'related_user_id',
        as: 'relatedUser'
      });
      
      // Optional: Related event (for event activities)
      UserActivity.belongsTo(models.Event, {
        foreignKey: 'related_entity_id',
        constraints: false,
        as: 'relatedEvent'
      });
      
      // Optional: Related transaction (for payment activities)
      UserActivity.belongsTo(models.UserTransaction, {
        foreignKey: 'related_entity_id',
        constraints: false,
        as: 'relatedTransaction'
      });
    }
    
    // Instance method to check if activity is recent
    isRecent(hours = 24) {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - hours);
      return this.activity_timestamp > cutoff;
    }
    
    // Instance method to get formatted activity description
    getFormattedDescription() {
      const baseDescription = this.activity_description || '';
      const timestamp = this.activity_timestamp.toLocaleString();
      return `[${timestamp}] ${baseDescription}`;
    }
    
    // Static method to log new activity
    static async logActivity(userId, activityData) {
      const {
        activity_type,
        activity_description,
        ip_address,
        user_agent,
        device_type = 'unknown',
        device_id,
        location_data,
        referrer,
        session_id,
        related_user_id,
        related_entity_type,
        related_entity_id,
        metadata,
        severity = 'low',
        is_suspicious = false
      } = activityData;
      
      return await this.create({
        user_id: userId,
        activity_type,
        activity_description,
        ip_address,
        user_agent,
        device_type,
        device_id,
        location_data,
        referrer,
        session_id,
        related_user_id,
        related_entity_type,
        related_entity_id,
        metadata,
        severity,
        is_suspicious,
        activity_timestamp: new Date()
      });
    }
  }

  UserActivity.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    activity_type: {
      type: DataTypes.ENUM(
        'login',
        'logout',
        'profile_view',
        'profile_update',
        'password_change',
        'email_change',
        'payment_method_added',
        'payment_method_removed',
        'transaction_completed',
        'event_registration',
        'event_cancellation',
        'friend_request_sent',
        'friend_request_accepted',
        'friend_request_declined',
        'message_sent',
        'support_ticket_created',
        'support_ticket_updated',
        'game_session_started',
        'game_session_ended',
        'achievement_unlocked',
        'level_up',
        'item_purchased',
        'subscription_started',
        'subscription_cancelled',
        'content_created',
        'content_shared',
        'content_liked',
        'content_commented',
        'search_performed',
        'settings_updated',
        'security_alert',
        'system_notification'
      ),
      allowNull: false,
      comment: 'Type of user activity'
    },
    activity_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description of the activity'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IPv4 or IPv6 address'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Browser/device user agent string'
    },
    device_type: {
      type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
      allowNull: false,
      defaultValue: 'unknown'
    },
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Unique device identifier'
    },
    location_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Geolocation data if available'
    },
    referrer: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'HTTP referrer URL'
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'User session identifier'
    },
    
    // Related entity references
    related_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'For activities involving another user'
    },
    related_entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of related entity (event, transaction, etc.)'
    },
    related_entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of related entity'
    },
    
    // Metadata and additional data
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional activity-specific data'
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'low',
      comment: 'Severity level for security/audit purposes'
    },
    is_suspicious: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag for suspicious activities'
    },
    
    // Timestamps
    activity_timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the activity actually occurred'
    }
  }, {
    sequelize,
    modelName: 'UserActivity',
    tableName: 'activity_',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['activity_type']
      },
      {
        fields: ['activity_timestamp']
      },
      {
        fields: ['ip_address']
      },
      {
        fields: ['session_id']
      },
      {
        fields: ['is_suspicious']
      },
      {
        fields: ['related_user_id']
      },
      {
        fields: ['related_entity_type', 'related_entity_id']
      }
    ]
  });

  return UserActivity;
};