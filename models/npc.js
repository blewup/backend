'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NPC extends Model {
    static associate(models) {
      // Association with AllianceCategory
      this.belongsTo(models.AllianceCategory, {
        foreignKey: 'alliance_category_id',
        as: 'category'
      });

      // Association with NPCLocation
      this.hasMany(models.NPCLocation, {
        foreignKey: 'npc_id',
        as: 'locations'
      });

      // Association with NPCInteraction
      this.hasMany(models.NPCInteraction, {
        foreignKey: 'npc_id',
        as: 'interactions'
      });
    }

    // Get current location of NPC
    async getCurrentLocation() {
      const location = await this.getLocations({
        where: { is_current: true },
        limit: 1
      });
      return location[0] || null;
    }

    // Update NPC location
    async updateLocation(x, y, zoneId) {
      // Set all existing locations to not current
      await this.sequelize.models.NPCLocation.update(
        { is_current: false },
        { 
          where: { 
            npc_id: this.id,
            is_current: true
          }
        }
      );

      // Create new current location
      return await this.sequelize.models.NPCLocation.create({
        npc_id: this.id,
        x_coord: x,
        y_coord: y,
        zone_id: zoneId,
        is_current: true
      });
    }

    // Check if interaction is allowed
    async canInteract(userId) {
      if (!this.interaction_cooldown) return true;

      const lastInteraction = await this.sequelize.models.NPCInteraction.findOne({
        where: { 
          npc_id: this.id,
          user_id: userId
        },
        order: [['created_at', 'DESC']]
      });

      if (!lastInteraction) return true;

      const cooldownMs = this.interaction_cooldown * 60 * 1000;
      const timeSinceLastInteraction = Date.now() - lastInteraction.created_at.getTime();
      
      return timeSinceLastInteraction >= cooldownMs;
    }

    // Record an interaction
    async recordInteraction(userId, type, data = null, result = null) {
      return await this.sequelize.models.NPCInteraction.create({
        npc_id: this.id,
        user_id: userId,
        interaction_type: type,
        interaction_data: data,
        result: result
      });
    }

    // Get trait value
    getTrait(traitName) {
      return this.traits[traitName] || 0;
    }

    // Check if NPC has ability
    hasAbility(abilityName) {
      return this.abilities && Object.keys(this.abilities).includes(abilityName);
    }

    // Get ability details
    getAbilityDetails(abilityName) {
      return this.abilities ? this.abilities[abilityName] : null;
    }

    // Get personality trait
    getPersonalityTrait(traitName) {
      return this.personality ? this.personality[traitName] : null;
    }

    // Get relationship status with faction/entity
    getRelationship(entityId) {
      return this.relationships ? this.relationships[entityId] : null;
    }

    // Get random dialogue for a specific context
    getDialogue(context) {
      if (!this.dialogue_sets || !this.dialogue_sets[context]) {
        return null;
      }
      const dialogues = this.dialogue_sets[context];
      return dialogues[Math.floor(Math.random() * dialogues.length)];
    }

    // Check if NPC has a specific quest flag
    hasQuestFlag(flagName) {
      return this.quest_flags ? this.quest_flags[flagName] : false;
    }

    // Get trade preference for an item type
    getTradePreference(itemType) {
      return this.trade_preferences ? this.trade_preferences[itemType] : null;
    }

    // Get combat stat
    getCombatStat(statName) {
      return this.combat_stats ? this.combat_stats[statName] : 0;
    }

    // Get faction standing
    getFactionStanding(factionId) {
      return this.faction_standings ? this.faction_standings[factionId] : 0;
    }

    // Check spawn conditions
    checkSpawnConditions(conditions) {
      if (!this.spawn_conditions) return true;
      
      for (const [condition, requirement] of Object.entries(this.spawn_conditions)) {
        if (!conditions[condition] || conditions[condition] !== requirement) {
          return false;
        }
      }
      return true;
    }

    // Get behavior pattern for a specific situation
    getBehaviorPattern(situation) {
      return this.behavior_patterns ? this.behavior_patterns[situation] : null;
    }

    // Check if NPC has an item in inventory
    hasItem(itemId) {
      return this.inventory ? this.inventory[itemId] > 0 : false;
    }

    // Get skill level
    getSkillLevel(skillName) {
      return this.skills ? this.skills[skillName] : 0;
    }

    // Check if NPC is available at current time
    isAvailableNow() {
      if (!this.availability_schedule) return true;

      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      const schedule = this.availability_schedule[day];
      if (!schedule) return true;

      return schedule.some(timeSlot => {
        return hour >= timeSlot.start && hour < timeSlot.end;
      });
    }

    // Get metadata value
    getMetadata(key) {
      return this.metadata ? this.metadata[key] : null;
    }
  }

  NPC.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    title: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    alliance_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'alliance_categories',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    traits: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidTraits(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Traits must be an object');
          }
          Object.values(value).forEach(trait => {
            if (typeof trait !== 'number' || trait < 0 || trait > 5) {
              throw new Error('Trait values must be numbers between 0 and 5');
            }
          });
        }
      }
    },
    abilities: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidAbilities(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Abilities must be an object');
          }
        }
      }
    },
    personality: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidPersonality(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Personality must be an object');
          }
        }
      }
    },
    relationships: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidRelationships(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Relationships must be an object');
          }
        }
      }
    },
    dialogue_sets: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidDialogueSets(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Dialogue sets must be an object');
          }
          Object.values(value).forEach(dialogues => {
            if (!Array.isArray(dialogues)) {
              throw new Error('Each dialogue set must be an array');
            }
          });
        }
      }
    },
    quest_flags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidQuestFlags(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Quest flags must be an object');
          }
        }
      }
    },
    trade_preferences: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidTradePreferences(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Trade preferences must be an object');
          }
        }
      }
    },
    combat_stats: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidCombatStats(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Combat stats must be an object');
          }
          Object.entries(value).forEach(([stat, value]) => {
            if (typeof value !== 'number' || value < 0 || value > 100) {
              throw new Error('Combat stat values must be numbers between 0 and 100');
            }
          });
        }
      }
    },
    faction_standings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidFactionStandings(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Faction standings must be an object');
          }
        }
      }
    },
    spawn_conditions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidSpawnConditions(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Spawn conditions must be an object');
          }
        }
      }
    },
    behavior_patterns: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidBehaviorPatterns(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Behavior patterns must be an object');
          }
        }
      }
    },
    inventory: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidInventory(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Inventory must be an object');
          }
          Object.values(value).forEach(quantity => {
            if (!Number.isInteger(quantity) || quantity < 0) {
              throw new Error('Inventory quantities must be non-negative integers');
            }
          });
        }
      }
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidSkills(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Skills must be an object');
          }
          Object.values(value).forEach(level => {
            if (!Number.isInteger(level) || level < 0 || level > 100) {
              throw new Error('Skill levels must be integers between 0 and 100');
            }
          });
        }
      }
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    is_unique: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    respawn_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    availability_schedule: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidSchedule(value) {
          if (!value) return;
          if (typeof value !== 'object') {
            throw new Error('Availability schedule must be an object');
          }
          Object.entries(value).forEach(([day, slots]) => {
            if (!Array.isArray(slots)) {
              throw new Error('Schedule slots must be arrays');
            }
            slots.forEach(slot => {
              if (!slot.start || !slot.end || 
                  slot.start < 0 || slot.start > 23 || 
                  slot.end < 0 || slot.end > 24 || 
                  slot.end <= slot.start) {
                throw new Error('Invalid time slot');
              }
            });
          });
        }
      }
    },
    interaction_cooldown: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidMetadata(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Metadata must be an object');
          }
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'NPC',
    tableName: 'npcs',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        fields: ['alliance_category_id']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return NPC;
};