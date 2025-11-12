'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AllianceMember extends Model {
    static associate(models) {
      AllianceMember.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      AllianceMember.belongsTo(models.Alliance, {
        foreignKey: 'alliance_id',
        as: 'alliance'
      });
    }
    
    canInvite() {
      const inviteRoles = ['officer', 'admin', 'leader'];
      return inviteRoles.includes(this.role);
    }

    canManageRoles() {
      const manageRoles = ['admin', 'leader'];
      return manageRoles.includes(this.role);
    }

    canManageTreasury() {
      const treasuryRoles = ['treasurer', 'admin', 'leader'];
      return treasuryRoles.includes(this.role);
    }

    getFormattedJoinDate() {
      return this.joined_at.toLocaleDateString();
    }

    static async promoteMember(allianceId, userId, newRole) {
      const validRoles = ['member', 'officer', 'treasurer', 'admin'];
      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role');
      }
      
      return await this.update(
        { role: newRole, promoted_at: new Date() },
        { where: { alliance_id: allianceId, user_id: userId } }
      );
    }
  }

  AllianceMember.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    alliance_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'alliances',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
    
    // Member Role and Permissions
    role: {
      type: DataTypes.ENUM('leader', 'admin', 'officer', 'treasurer', 'member', 'recruit'),
      allowNull: false,
      defaultValue: 'recruit'
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Custom permissions for this member'
    },
    
    // Member Status
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'kicked', 'left'),
      allowNull: false,
      defaultValue: 'active'
    },
    
    // Contribution and Activity Tracking
    total_contributions: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total credits contributed to alliance treasury'
    },
    xp_earned: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'XP earned for the alliance'
    },
    activity_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Weekly activity score (0-100)'
    },
    last_activity: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time member was active in alliance activities'
    },
    
    // Titles and Recognition
    custom_title: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Custom title assigned by alliance leadership'
    },
    achievements: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Alliance-specific achievements'
    },
    
    // Join and Leave Tracking
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When member left the alliance'
    },
    promoted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time member was promoted'
    },
    
    // Invitation and Application Info
    invited_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'User who invited this member'
    },
    application_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Application message if membership_type is approval'
    },
    
    // Leave/Kick Information
    leave_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for leaving the alliance'
    },
    kick_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for being kicked from alliance'
    },
    kicked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'User who kicked this member'
    },
    
    // Settings and Preferences
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Member-specific alliance settings'
    },
    notification_preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Alliance notification preferences'
    },
    
    // Statistics
    events_participated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of alliance events participated in'
    },
    missions_completed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of alliance missions completed'
    },
    resources_donated: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Tracking of various resources donated'
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional member data'
    }
  }, {
    sequelize,
    modelName: 'AllianceMember',
    tableName: 'alliance_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['alliance_id', 'user_id']
      },
      {
        fields: ['alliance_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['role']
      },
      {
        fields: ['status']
      },
      {
        fields: ['joined_at']
      },
      {
        fields: ['activity_score']
      },
      {
        fields: ['total_contributions']
      }
    ],
    hooks: {
      beforeCreate: async (allianceMember) => {
        if (!allianceMember.joined_at) {
          allianceMember.joined_at = new Date();
        }
      },
      
      beforeUpdate: (allianceMember) => {
        if (allianceMember.changed('status') && 
            ['left', 'kicked'].includes(allianceMember.status) && 
            !allianceMember.left_at) {
          allianceMember.left_at = new Date();
        }

        if (allianceMember.changed('activity_score')) {
          allianceMember.last_activity = new Date();
        }
      }
    }
  });

  return AllianceMember;
};