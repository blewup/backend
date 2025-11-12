'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GameDownload extends Model {
    static associate(models) {
      GameDownload.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      GameDownload.belongsTo(models.GameVersion, {
        foreignKey: 'version_id',
        as: 'version'
      });
    }

    // Instance method to get device info
    getDeviceInfo() {
      if (!this.device_info) return null;
      
      const info = this.device_info;
      return {
        os: info.os || 'Unknown',
        device: info.device || 'Unknown',
        browser: info.browser || 'Unknown',
        isMobile: info.isMobile || false
      };
    }

    // Static method to get download statistics
    static async getDownloadStats(timeRange = 'all') {
      const { Op } = require('sequelize');
      let whereCondition = {};
      
      // Set time range filter
      if (timeRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }
        
        if (startDate) {
          whereCondition.downloaded_at = { [Op.gte]: startDate };
        }
      }

      const stats = await this.findAll({
        where: whereCondition,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_downloads'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'unique_users'],
          [sequelize.fn('MAX', sequelize.col('downloaded_at')), 'last_download']
        ],
        raw: true
      });

      return stats[0] || { total_downloads: 0, unique_users: 0, last_download: null };
    }

    // Static method to get popular versions
    static async getPopularVersions(limit = 5) {
      const { Op } = require('sequelize');
      
      return await this.findAll({
        attributes: [
          'version_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'download_count']
        ],
        include: [{
          model: sequelize.models.GameVersion,
          as: 'version',
          attributes: ['id', 'version', 'version_code', 'is_beta']
        }],
        group: ['version_id'],
        order: [[sequelize.literal('download_count'), 'DESC']],
        limit: parseInt(limit)
      });
    }
  }

  GameDownload.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow anonymous downloads
      references: {
        model: 'users',
        key: 'id'
      }
    },
    version_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'game_versions',
        key: 'id'
      }
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      validate: {
        isIP: true
      }
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Structured device and browser information'
    },
    country_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
      validate: {
        len: [2, 2],
        isUppercase: true
      }
    },
    download_speed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Download speed in bytes per second'
    },
    download_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Download duration in milliseconds'
    },
    is_complete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'GameDownload',
    tableName: 'game_downloads',
    timestamps: true,
    createdAt: 'downloaded_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['version_id']
      },
      {
        fields: ['downloaded_at']
      },
      {
        fields: ['ip_address']
      },
      {
        fields: ['country_code']
      },
      {
        fields: ['user_id', 'version_id']
      }
    ],
    hooks: {
      beforeCreate: async (download) => {
        // Extract country code from IP address if available
        if (download.ip_address && !download.country_code) {
          try {
            // This is a simple example - in production, use a proper IP geolocation service
            // For now, we'll just set a placeholder
            download.country_code = 'XX';
          } catch (error) {
            console.warn('Failed to extract country code from IP:', error.message);
          }
        }

        // Parse user agent for device info
        if (download.user_agent && !download.device_info) {
          try {
            const UAParser = require('ua-parser-js');
            const parser = new UAParser(download.user_agent);
            const result = parser.getResult();
            
            download.device_info = {
              browser: result.browser.name || 'Unknown',
              os: result.os.name || 'Unknown',
              device: result.device.model || result.device.type || 'Unknown',
              isMobile: result.device.type === 'mobile'
            };
          } catch (error) {
            console.warn('Failed to parse user agent:', error.message);
          }
        }
      }
    }
  });

  return GameDownload;
};