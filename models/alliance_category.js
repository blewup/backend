'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AllianceCategory extends Model {
    static associate(models) {
      // Primary alliance categories
      AllianceCategory.hasMany(models.Alliance, {
        foreignKey: 'category_id',
        as: 'alliances'
      });

      // Secondary alliance categories (subcategories)
      AllianceCategory.belongsToMany(models.Alliance, {
        through: 'alliance_subcategories',
        foreignKey: 'category_id',
        otherKey: 'alliance_id',
        as: 'secondaryAlliances'
      });
    }

    // Helper method to get trait value
    getTrait(traitName) {
      return this.traits[traitName] || 0;
    }

    // Helper method to get bonus value
    getBonus(bonusName) {
      return this.bonuses[bonusName] || 0;
    }

    // Helper method to check if alliance meets category requirements
    checkRequirements(alliance) {
      const requirements = this.requirements;
      if (!requirements) return true;

      for (const [key, value] of Object.entries(requirements)) {
        switch (key) {
          case 'min_level':
            if (alliance.level < value) return false;
            break;
          case 'economy_score':
            if (alliance.economy_score < value) return false;
            break;
          case 'combat_score':
            if (alliance.combat_score < value) return false;
            break;
          case 'research_score':
            if (alliance.research_score < value) return false;
            break;
          case 'diplomatic_score':
            if (alliance.diplomatic_score < value) return false;
            break;
          case 'exploration_score':
            if (alliance.exploration_score < value) return false;
            break;
          // Add more requirement checks as needed
        }
      }
      return true;
    }

    // Helper method to check if ability is available
    hasAbility(abilityName) {
      return this.abilities && Object.keys(this.abilities).includes(abilityName);
    }

    // Helper method to get ability details
    getAbilityDetails(abilityName) {
      return this.abilities ? this.abilities[abilityName] : null;
    }

    // Helper method to check specialization
    hasSpecialization(specializationName) {
      return this.specializations && this.specializations.includes(specializationName);
    }

    // Helper method to check if resource is available
    hasSpecialResource(resourceName) {
      return this.special_resources && this.special_resources.includes(resourceName);
    }

    // Helper method to get power score
    calculatePowerScore(alliance) {
      let score = this.power_index;

      // Apply bonuses based on traits
      if (this.traits) {
        Object.entries(this.traits).forEach(([trait, value]) => {
          score += value * 10; // Each trait point adds 10 to power score
        });
      }

      // Apply member count modifier
      const memberCount = alliance ? alliance.member_count : this.min_members;
      score *= (1 + (memberCount / 100)); // Each 100 members adds 100% to power

      // Apply resource multiplier
      score *= this.resource_multiplier;

      return Math.round(score);
    }

    // Helper method to check if category is at member capacity
    isAtCapacity(currentMembers) {
      return this.max_members ? currentMembers >= this.max_members : false;
    }

    // Helper method to get progression level based on points
    getProgressionLevel(points) {
      if (!this.progression) return 0;
      
      const levels = Object.entries(this.progression)
        .sort(([, a], [, b]) => a - b);
      
      for (const [level, requirement] of levels) {
        if (points < requirement) return parseInt(level) - 1;
      }
      
      return levels.length;
    }

    // Helper method to get balance factor value
    getBalanceFactor(factorName) {
      return this.balance_factors ? this.balance_factors[factorName] : 1.0;
    }

    // Helper method to validate unlock requirements
    checkUnlockRequirements(userProfile) {
      if (!this.unlock_requirements) return true;

      for (const [requirement, value] of Object.entries(this.unlock_requirements)) {
        const userValue = userProfile[requirement];
        if (typeof userValue === 'undefined' || userValue < value) return false;
      }

      return true;
    }

    // Helper method to get metadata value
    getMetadata(key) {
      return this.metadata ? this.metadata[key] : null;
    }
  }

  AllianceCategory.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 20],
        isUppercase: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Traits and Bonuses
    traits: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'Special traits and characteristics',
      validate: {
        isValidTraits(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Traits must be an object');
          }
          // Validate trait values are numbers between 0 and 5
          Object.values(value).forEach(trait => {
            if (typeof trait !== 'number' || trait < 0 || trait > 5) {
              throw new Error('Trait values must be numbers between 0 and 5');
            }
          });
        }
      }
    },
    bonuses: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'Category-specific bonuses',
      validate: {
        isValidBonuses(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Bonuses must be an object');
          }
          // Validate bonus values are numbers
          Object.values(value).forEach(bonus => {
            if (typeof bonus !== 'number') {
              throw new Error('Bonus values must be numbers');
            }
          });
        }
      }
    },
    requirements: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'Requirements to form this type of alliance',
      validate: {
        isValidRequirements(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Requirements must be an object');
          }
        }
      }
    },
    abilities: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'Special abilities unlocked by this category',
      validate: {
        isValidAbilities(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Abilities must be an object');
          }
        }
      }
    },
    progression: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'Category-specific progression path',
      validate: {
        isValidProgression(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Progression must be an object');
          }
          // Validate progression values are positive numbers
          Object.values(value).forEach(points => {
            if (typeof points !== 'number' || points < 0) {
              throw new Error('Progression values must be positive numbers');
            }
          });
        }
      }
    },
    
    // Specializations
    specializations: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Available specializations within this category',
      validate: {
        isValidSpecializations(value) {
          if (!Array.isArray(value)) {
            throw new Error('Specializations must be an array');
          }
        }
      }
    },
    special_resources: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Category-specific resources',
      validate: {
        isValidResources(value) {
          if (!Array.isArray(value)) {
            throw new Error('Special resources must be an array');
          }
        }
      }
    },
    special_buildings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Category-specific buildings',
      validate: {
        isValidBuildings(value) {
          if (!Array.isArray(value)) {
            throw new Error('Special buildings must be an array');
          }
        }
      }
    },
    
    // Visual Elements
    icon_url: {
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
    color_scheme: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Category-specific colors and themes',
      validate: {
        isValidColorScheme(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Color scheme must be an object');
          }
          if (value) {
            ['primary', 'secondary', 'accent'].forEach(key => {
              if (value[key] && !/^#[0-9A-F]{6}$/i.test(value[key])) {
                throw new Error(`Invalid hex color for ${key}`);
              }
            });
          }
        }
      }
    },
    
    // Gameplay Elements
    min_members: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    max_members: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        isValidMaxMembers(value) {
          if (value !== null && value < this.min_members) {
            throw new Error('Max members must be greater than or equal to min members');
          }
        }
      }
    },
    territory_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum territory size'
    },
    resource_multiplier: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 1.00,
      validate: {
        min: 0.1,
        max: 10.0
      }
    },
    
    // Balancing
    power_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: 'Base power rating (100 is standard)'
    },
    balance_factors: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'Category-specific balance adjustments',
      validate: {
        isValidBalanceFactors(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Balance factors must be an object');
          }
          Object.values(value).forEach(factor => {
            if (typeof factor !== 'number' || factor < 0) {
              throw new Error('Balance factors must be positive numbers');
            }
          });
        }
      }
    },
    
    // Status and Unlocks
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    unlock_requirements: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Requirements to unlock this category',
      validate: {
        isValidUnlockRequirements(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Unlock requirements must be an object');
          }
        }
      }
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional category data',
      validate: {
        isValidMetadata(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Metadata must be an object');
          }
        }
      }
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'AllianceCategory',
    tableName: 'alliance_categories',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['sort_order']
      }
    ]
  });

  return AllianceCategory;
};