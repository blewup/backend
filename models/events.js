'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      // FIXED: Use proper model references
      Event.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      Event.hasMany(models.EventsParticipant, {
        foreignKey: 'event_id',
        as: 'participants'
      });
      Event.hasMany(models.EventRSVP, {
        foreignKey: 'event_id',
        as: 'rsvps'
      });
    }

    // KEEP ALL YOUR ORIGINAL METHODS
    isUpcoming() {
      const now = new Date();
      const eventDateTime = new Date(`${this.event_date}T${this.event_time || '00:00:00'}`);
      return eventDateTime > now;
    }

    getStatus() {
      const now = new Date();
      const eventDateTime = new Date(`${this.event_date}T${this.event_time || '00:00:00'}`);
      const endDateTime = this.end_date ? new Date(`${this.end_date}T23:59:59`) : eventDateTime;

      if (now < eventDateTime) return 'upcoming';
      if (now >= eventDateTime && now <= endDateTime) return 'ongoing';
      return 'completed';
    }

    getFormattedDate() {
      return new Date(this.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Static method to generate holiday events
    static async generateHolidayEvents(startDate, endDate) {
      const holidays = this.getHolidaysForPeriod(startDate, endDate);
      const events = [];

      for (const holiday of holidays) {
        const existingEvent = await this.findOne({
          where: {
            title: holiday.title,
            event_date: holiday.event_date
          }
        });

        if (!existingEvent) {
          events.push(holiday);
        }
      }

      return events;
    }

    // Static method to get holidays for a period
    static getHolidaysForPeriod(startDate, endDate) {
      const holidays = [];
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      const holidayTemplates = [
        // Major Holidays
        { date: `${currentYear}-01-01`, title: "New Year's Day", type: 'holiday', color: '#FF6B6B' },
        { date: `${currentYear}-02-14`, title: "Valentine's Day", type: 'holiday', color: '#E91E63' },
        { date: `${currentYear}-03-17`, title: "St. Patrick's Day", type: 'holiday', color: '#4CAF50' },
        { date: `${currentYear}-04-01`, title: "April Fools' Day", type: 'holiday', color: '#FF9800' },
        { date: `${currentYear}-05-05`, title: "Cinco de Mayo", type: 'holiday', color: '#FF5722' },
        { date: `${currentYear}-06-21`, title: "Summer Solstice", type: 'holiday', color: '#FFC107' },
        { date: `${currentYear}-07-04`, title: "Independence Day", type: 'holiday', color: '#F44336' },
        { date: `${currentYear}-10-31`, title: "Halloween", type: 'holiday', color: '#7B1FA2' },
        { date: `${currentYear}-11-11`, title: "Veterans Day", type: 'holiday', color: '#795548' },
        { date: `${currentYear}-11-28`, title: "Thanksgiving", type: 'holiday', color: '#FF9800' },
        { date: `${currentYear}-12-25`, title: "Christmas Day", type: 'holiday', color: '#F44336' },
        { date: `${currentYear}-12-31`, title: "New Year's Eve", type: 'holiday', color: '#2196F3' },

        // Gaming & Community Events
        { date: `${currentYear}-01-15`, title: "Winter Tournament", type: 'tournament', color: '#4CAF50' },
        { date: `${currentYear}-02-20`, title: "Community Challenge Week", type: 'community', color: '#9C27B0' },
        { date: `${currentYear}-03-25`, title: "Spring Update Launch", type: 'update', color: '#2196F3' },
        { date: `${currentYear}-04-15`, title: "Easter Egg Hunt", type: 'community', color: '#FFC107' },
        { date: `${currentYear}-05-15`, title: "Mid-Year Championship", type: 'tournament', color: '#FF5722' },
        { date: `${currentYear}-06-30`, title: "Summer Beta Release", type: 'beta', color: '#607D8B' },
        { date: `${currentYear}-07-20`, title: "Anniversary Celebration", type: 'community', color: '#E91E63' },
        { date: `${currentYear}-08-15`, title: "Summer Tournament Finals", type: 'tournament', color: '#4CAF50' },
        { date: `${currentYear}-09-22`, title: "Autumn Equinox Festival", type: 'community', color: '#FF9800' },
        { date: `${currentYear}-10-15`, title: "Halloween Update", type: 'update', color: '#7B1FA2' },
        { date: `${currentYear}-11-20`, title: "Pre-Holiday Tournament", type: 'tournament', color: '#F44336' },
        { date: `${currentYear}-12-15`, title: "Winter Update & Gifts", type: 'update', color: '#2196F3' },

        // Next Year Events
        { date: `${nextYear}-01-15`, title: "New Year Tournament", type: 'tournament', color: '#4CAF50' },
        { date: `${nextYear}-02-14`, title: "Valentine's Special", type: 'community', color: '#E91E63' },
        { date: `${nextYear}-03-20`, title: "Spring Equinox Update", type: 'update', color: '#4CAF50' },
        { date: `${nextYear}-04-22`, title: "Earth Day Celebration", type: 'community', color: '#4CAF50' },
        { date: `${nextYear}-05-25`, title: "Memorial Day Tournament", type: 'tournament', color: '#F44336' },
        { date: `${nextYear}-06-21`, title: "Summer Solstice Festival", type: 'community', color: '#FFC107' },
        { date: `${nextYear}-07-04`, title: "Independence Day Event", type: 'holiday', color: '#F44336' },
        { date: `${nextYear}-08-30`, title: "End of Summer Bash", type: 'community', color: '#FF9800' },
        { date: `${nextYear}-09-21`, title: "Autumn Tournament", type: 'tournament', color: '#FF5722' },
        { date: `${nextYear}-10-31`, title: "Halloween Special", type: 'holiday', color: '#7B1FA2' },
        { date: `${nextYear}-11-27`, title: "Thanksgiving Feast", type: 'community', color: '#FF9800' },
        { date: `${nextYear}-12-24`, title: "Christmas Eve Tournament", type: 'tournament', color: '#F44336' }
      ];

      const start = new Date(startDate);
      const end = new Date(endDate);

      return holidayTemplates
        .map(holiday => {
          const holidayDate = new Date(holiday.date);
          return {
            ...holiday,
            event_date: holiday.date,
            event_time: '00:00:00',
            description: this.generateHolidayDescription(holiday.title, holiday.type),
            is_featured: ['tournament', 'update'].includes(holiday.type),
            is_main_event: holiday.type === 'tournament',
            registration_required: holiday.type === 'tournament',
            max_participants: holiday.type === 'tournament' ? 100 : null,
            prize_pool: holiday.type === 'tournament' ? this.generatePrizePool() : null,
            color: holiday.color
          };
        })
        .filter(holiday => {
          const holidayDate = new Date(holiday.event_date);
          return holidayDate >= start && holidayDate <= end;
        });
    }

    // Generate dynamic descriptions for events
    static generateHolidayDescription(title, type) {
      const descriptions = {
        holiday: `Join us for a special ${title} celebration! Exclusive rewards and community fun await.`,
        tournament: `Compete in our ${title} for amazing prizes and eternal glory! Register now to secure your spot.`,
        community: `Community ${title} event! Hang out with fellow players and enjoy special activities.`,
        update: `Major ${title} is here! New features, improvements, and surprises await.`,
        beta: `Be among the first to experience our ${title}. Help us test new features and provide feedback.`,
        release: `Official ${title} is live! Download now and explore all the new content.`
      };

      return descriptions[type] || `Don't miss our ${title} event!`;
    }

    // Generate random prize pools for tournaments
    static generatePrizePool() {
      const prizes = [
        "10,000 Kusher Coins + Exclusive Skin",
        "5,000 Kusher Coins + Legendary Item",
        "2,500 Kusher Coins + Rare Bundle",
        "Special Edition NFT + 1,000 Coins",
        "VIP Access Pass + Custom Title"
      ];
      return prizes[Math.floor(Math.random() * prizes.length)];
    }
  }

  Event.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    event_type: {
      type: DataTypes.ENUM('release', 'beta', 'tournament', 'community', 'maintenance', 'update', 'holiday'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    event_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_main_event: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    registration_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    current_participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    prize_pool: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#4CAF50'
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['event_date']
      },
      {
        fields: ['event_type']
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['is_main_event']
      }
    ]
  });

  return Event;
};