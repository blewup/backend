'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Alliance extends Model {
    static associate(models) {
      Alliance.belongsTo(models.User, {
        foreignKey: 'leader_id',
        as: 'leader'
      });

      Alliance.hasMany(models.AllianceMember, {
        foreignKey: 'alliance_id',
        as: 'members'
      });

      Alliance.hasMany(models.Event, {
        foreignKey: 'alliance_id',
        as: 'organizedEvents'
      });

      Alliance.hasMany(models.AllianceNPC, {
        foreignKey: 'alliance_id',
        as: 'npcs'
      });
    }

    async isMember(userId) {
      const member = await sequelize.models.AllianceMember.findOne({
        where: {
          alliance_id: this.id,
          user_id: userId,
          status: 'active'
        }
      });
      return !!member;
    }

    async getMemberCount() {
      return await sequelize.models.AllianceMember.count({
        where: {
          alliance_id: this.id,
          status: 'active'
        }
      });
    }

    async isFull() {
      const memberCount = await this.getMemberCount();
      return this.max_members && memberCount >= this.max_members;
    }
  }

  Alliance.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    leader_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100]
      }
    },
    tag: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Alliance tag/abbreviation (e.g., KUSH, LEGEND)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    motto: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Alliance motto or slogan'
    },
    
    // Alliance Type and Focus
    alliance_type: {
      type: DataTypes.ENUM(
        'casual', 
        'competitive', 
        'roleplay', 
        'trading', 
        'exploration', 
        'combat', 
        'builder', 
        'social',
        'mixed'
      ),
      allowNull: false,
      defaultValue: 'mixed'
    },
    primary_focus: {
      type: DataTypes.ENUM(
        'pve',
        'pvp', 
        'economy',
        'exploration',
        'building',
        'research',
        'community',
        'events'
      ),
      allowNull: true
    },
    
    // Membership Settings
    membership_type: {
      type: DataTypes.ENUM('open', 'approval', 'invite_only', 'closed'),
      allowNull: false,
      defaultValue: 'approval',
      comment: 'How new members can join'
    },
    max_members: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 2,
        max: 1000
      },
      comment: 'Maximum number of members (null for unlimited)'
    },
    min_level_requirement: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    
    // Media and Branding
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    banner_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    color_primary: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      },
      comment: 'Primary color in hex format'
    },
    color_secondary: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      },
      comment: 'Secondary color in hex format'
    },
    
    // Statistics and Rankings
    total_xp: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total alliance experience points'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Global alliance ranking'
    },
    reputation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Alliance reputation score'
    },
    
    // Treasury and Economy
    treasury_balance: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Alliance treasury credits'
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.00,
      validate: {
        min: 0,
        max: 50
      },
      comment: 'Tax rate percentage for member contributions'
    },
    
    // Communication
    discord_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    website_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    
    // Settings and Permissions
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Alliance-specific settings and configurations'
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Role-based permission settings'
    },
    
    // Status and Visibility
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether alliance is publicly visible'
    },
    is_recruiting: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether alliance is actively recruiting'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'disbanded'),
      allowNull: false,
      defaultValue: 'active'
    },
    
    // Location and Headquarters
    headquarters_planet: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Home planet or base location'
    },
    headquarters_galaxy: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Home galaxy'
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional alliance data'
    },
    
    // Timestamps
    founded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    disbanded_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Alliance',
    tableName: 'alliances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['leader_id']
      },
      {
        fields: ['name'],
        unique: true
      },
      {
        fields: ['tag'],
        unique: true
      },
      {
        fields: ['alliance_type']
      },
      {
        fields: ['membership_type']
      },
      {
        fields: ['level']
      },
      {
        fields: ['rank']
      },
      {
        fields: ['is_public']
      },
      {
        fields: ['is_recruiting']
      },
      {
        fields: ['status']
      },
      {
        fields: ['total_xp']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeUpdate: async (alliance) => {
        if (alliance.changed('total_xp')) {
          const xp = alliance.total_xp;
          alliance.level = Math.floor(Math.sqrt(xp / 1000)) + 1;
        }

        if (alliance.changed('status') && alliance.status === 'disbanded' && !alliance.disbanded_at) {
          alliance.disbanded_at = new Date();
        }
      }
    }
  });

  return Alliance;
};