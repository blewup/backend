'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Core profile associations
      User.hasOne(models.UserProfile, { 
        foreignKey: 'user_id',
        as: 'profile',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.UserLocation, { 
        foreignKey: 'user_id',
        as: 'locations',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.UserSocialProfile, { 
        foreignKey: 'user_id',
        as: 'socialProfiles',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.UserActivity, { 
        foreignKey: 'user_id',
        as: 'activities',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.UserTransaction, { 
        foreignKey: 'user_id',
        as: 'transactions',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.UserPaymentMethod, { 
        foreignKey: 'user_id',
        as: 'paymentMethods',
        onDelete: 'CASCADE'
      });
      
      // Events associations
      User.hasMany(models.Event, { 
        foreignKey: 'created_by',
        as: 'createdEvents'
      });

      User.hasMany(models.EventsParticipant, { 
        foreignKey: 'user_id',
        as: 'eventRegistrations',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.EventRSVP, { 
        foreignKey: 'user_id',
        as: 'eventRSVPs',
        onDelete: 'CASCADE'
      });
      
      // Social interactions
      User.hasMany(models.FriendRequest, { 
        foreignKey: 'sender_id',
        as: 'sentFriendRequests'
      });

      User.hasMany(models.FriendRequest, { 
        foreignKey: 'receiver_id',
        as: 'receivedFriendRequests'
      });
      
      // Messaging
      User.hasMany(models.ConversationParticipant, { 
        foreignKey: 'user_id',
        as: 'conversations',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.ConversationMessage, { 
        foreignKey: 'sender_id',
        as: 'sentMessages'
      });

      User.hasMany(models.ConversationMessage, { 
        foreignKey: 'receiver_id',
        as: 'receivedMessages'
      });
      
      // Support system
      User.hasMany(models.SupportTicket, { 
        foreignKey: 'user_id',
        as: 'submittedTickets',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.SupportTicket, { 
        foreignKey: 'assigned_to',
        as: 'assignedTickets'
      });

      User.hasMany(models.SupportResponse, { 
        foreignKey: 'responder_id',
        as: 'supportResponses'
      });

      // Alliances
      User.hasMany(models.Alliance, { 
        foreignKey: 'leader_id',
        as: 'ledAlliances'
      });

      User.hasMany(models.AllianceMember, { 
        foreignKey: 'user_id',
        as: 'allianceMemberships',
        onDelete: 'CASCADE'
      });

      User.hasMany(models.AllianceMember, {
        foreignKey: 'invited_by',
        as: 'sentAllianceInvites'
      });

      User.hasMany(models.AllianceMember, {
        foreignKey: 'kicked_by',
        as: 'allianceKicks'
      });
      
      // Uploads
      User.hasMany(models.Upload, { 
        foreignKey: 'user_id', 
        as: 'Upload' 
      });
    }
    
    // Instance methods
    toJSON() {
      const values = { ...this.get() };
      
      // Remove sensitive fields
      delete values.password_hash;
      delete values.recovery_email_1;
      delete values.recovery_email_2;
      delete values.deletion_reason;
      delete values.profile_clear_reason;
      
      return values;
    }
    
    // Method to get public profile data
    getPublicProfile() {
      return {
        id: this.id,
        username: this.username,
        first_name: this.first_name,
        last_name: this.last_name,
        biography: this.biography,
        preferred_gameplay_type: this.preferred_gameplay_type,
        profile_picture: this.profile_picture,
        profile_picture_type: this.profile_picture_type,
        cover_photo: this.cover_photo,
        cover_photo_type: this.cover_photo_type,
        created_at: this.created_at,
        last_login: this.last_login
      };
    }
    
    // Method to check if user is admin
    isAdmin() {
      return this.user_type === 'admin' || this.user_type === 'super_admin';
    }
    
    // Method to check if user is moderator
    isModerator() {
      return this.user_type === 'moderator' || this.isAdmin();
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    recovery_email_1: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    recovery_email_2: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString().split('T')[0]
      }
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    preferred_gameplay_type: {
      type: DataTypes.ENUM('casual', 'competitive', 'roleplay', 'builder', 'explorer', 'social', 'hardcore', 'speedrun'),
      defaultValue: 'casual',
      allowNull: false
    },
    profile_picture: {
      type: DataTypes.BLOB('long'),
      allowNull: true
    },
    profile_picture_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    cover_photo: {
      type: DataTypes.BLOB('long'),
      allowNull: true
    },
    cover_photo_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    user_type: {
      type: DataTypes.ENUM('user', 'admin', 'super_admin', 'moderator'),
      allowNull: false,
      defaultValue: 'user'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    profile_cleared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    profile_cleared_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profile_clear_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletion_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    defaultScope: {
      where: {
        is_deleted: false,
        is_active: true
      }
    },
    scopes: {
      // Scope to include deleted users
      withDeleted: {
        where: {}
      },
      // Scope for admin operations
      admin: {
        where: {
          user_type: ['admin', 'super_admin', 'moderator']
        }
      },
      // Scope for active users only
      active: {
        where: {
          is_active: true
        }
      },
      // Scope for public profile data
      publicProfile: {
        attributes: [
          'id', 'username', 'first_name', 'last_name', 'biography',
          'preferred_gameplay_type', 'profile_picture', 'profile_picture_type',
          'cover_photo', 'cover_photo_type', 'created_at', 'last_login'
        ]
      }
    },
    hooks: {
      beforeUpdate: (user) => {
        user.updated_at = new Date();
      },
      beforeCreate: (user) => {
        if (!user.preferred_gameplay_type) {
          user.preferred_gameplay_type = 'casual';
        }
      }
    }
  });

  return User;
};