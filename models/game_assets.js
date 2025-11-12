'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GameAsset extends Model {
    static associate(models) {
      // No direct associations needed for basic assets
    }

    // Instance method to get public URL
    getPublicUrl() {
      return `/api/game/assets/${this.id}/file`;
    }

    // Instance method to get optimized URL
    getOptimizedUrl() {
      return this.optimized_path ? `/api/game/assets/${this.id}/optimized` : this.getPublicUrl();
    }

    // Instance method to get thumbnail URL (for different asset types)
    getThumbnailUrl() {
      if (!this.optimized_path) return this.getPublicUrl();
      
      const thumbnails = {
        cover: `/api/game/assets/${this.id}/optimized`,
        portrait: `/api/game/assets/${this.id}/optimized`,
        screenshot: `/api/game/assets/${this.id}/optimized`,
        icon: `/api/game/assets/${this.id}/file` // Use original for icons
      };
      
      return thumbnails[this.asset_type] || this.getPublicUrl();
    }

    // Instance method to get formatted file size
    getFormattedFileSize(useOptimized = false) {
      const bytes = useOptimized && this.optimized_size ? this.optimized_size : this.file_size;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Bytes';
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Instance method to check if file exists
    async fileExists() {
      const fs = require('fs').promises;
      try {
        await fs.access(this.file_path);
        return true;
      } catch {
        return false;
      }
    }

    // Static method to get assets by type
    static async getByType(assetType, options = {}) {
      const { limit = 50, includePrivate = false } = options;
      
      const whereCondition = { asset_type: assetType };
      if (!includePrivate) {
        whereCondition.is_public = true;
      }

      return await this.findAll({
        where: whereCondition,
        order: [
          ['order_index', 'ASC'],
          ['created_at', 'DESC']
        ],
        limit: parseInt(limit)
      });
    }

    // Static method to get cover image
    static async getCoverImage() {
      return await this.findOne({
        where: { 
          asset_type: 'cover',
          is_public: true
        },
        order: [['created_at', 'DESC']]
      });
    }

    // Static method to get screenshots
    static async getScreenshots(limit = 10) {
      return await this.getByType('screenshot', { limit });
    }
  }

  GameAsset.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    asset_type: {
      type: DataTypes.ENUM('screenshot', 'cover', 'portrait', 'icon', 'trailer'),
      allowNull: false,
      validate: {
        isIn: [['screenshot', 'cover', 'portrait', 'icon', 'trailer']]
      }
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    optimized_path: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1
      }
    },
    optimized_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      validate: {
        isInt: true,
        min: 1
      }
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidDimensions(value) {
          if (value && (typeof value.width !== 'number' || typeof value.height !== 'number')) {
            throw new Error('Dimensions must contain width and height as numbers');
          }
        }
      }
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0
      }
    },
    alt_text: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional asset metadata'
    },
    compression_ratio: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.optimized_size || !this.file_size) return null;
        return Math.round((1 - this.optimized_size / this.file_size) * 100);
      }
    }
  }, {
    sequelize,
    modelName: 'GameAsset',
    tableName: 'game_assets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['asset_type']
      },
      {
        fields: ['is_public']
      },
      {
        fields: ['order_index']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['asset_type', 'is_public']
      }
    ],
    hooks: {
      beforeValidate: (asset) => {
        // Set default order index if not provided
        if (asset.order_index === null || asset.order_index === undefined) {
          asset.order_index = 0;
        }
      },
      beforeDestroy: async (asset) => {
        const fs = require('fs').promises;
        
        // Delete physical files
        try {
          if (asset.file_path) await fs.unlink(asset.file_path);
          if (asset.optimized_path) await fs.unlink(asset.optimized_path);
        } catch (error) {
          console.warn('Failed to delete asset files:', error.message);
        }
      }
    }
  });

  return GameAsset;
};