'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GameVersion extends Model {
    static associate(models) {
      GameVersion.hasMany(models.GameDownload, {
        foreignKey: 'version_id',
        as: 'downloads'
      });
    }

    // Instance method to get download URL
    getDownloadUrl() {
      return `/api/game/download/${this.id}`;
    }

    // Instance method to check if version is latest
    async isLatest() {
      const latestVersion = await GameVersion.findOne({
        where: { is_active: true, is_beta: false },
        order: [['version_code', 'DESC']]
      });
      return latestVersion && this.id === latestVersion.id;
    }

    // Instance method to get formatted file size
    getFormattedFileSize() {
      const bytes = this.file_size;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Bytes';
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Static method to get latest version
    static async getLatest(includeBeta = false) {
      const whereCondition = { is_active: true };
      if (!includeBeta) {
        whereCondition.is_beta = false;
      }

      return await this.findOne({
        where: whereCondition,
        order: [['version_code', 'DESC']]
      });
    }

    // Static method to increment download count
    static async incrementDownload(versionId) {
      return await this.increment('download_count', {
        where: { id: versionId }
      });
    }

    // NEW: Automatic version number generation
    static async generateNextVersion(isBeta = false) {
      try {
        // Get the latest version of the same type (beta/release)
        const latestVersion = await this.findOne({
          where: { 
            is_beta: isBeta,
            is_active: true
          },
          order: [['version_code', 'DESC']]
        });

        let nextVersionNumber;
        let nextVersionCode;

        if (!latestVersion) {
          // No versions exist yet, start with 0.0.1
          nextVersionNumber = '0.0.1';
          nextVersionCode = 1;
        } else {
          // Parse current version and increment
          const versionParts = latestVersion.version.split('.').map(part => parseInt(part));
          const [major, minor, patch] = versionParts;

          // Increment following semantic versioning rules
          let newMajor = major;
          let newMinor = minor;
          let newPatch = patch + 1;

          // When patch reaches 999, increment minor and reset patch
          if (newPatch >= 1000) {
            newPatch = 0;
            newMinor += 1;
            
            // When minor reaches 1000, increment major and reset minor
            if (newMinor >= 1000) {
              newMinor = 0;
              newMajor += 1;
            }
          }

          nextVersionNumber = `${newMajor}.${newMinor}.${newPatch}`;
          nextVersionCode = latestVersion.version_code + 1;
        }

        // Add beta suffix if needed
        if (isBeta) {
          nextVersionNumber += '-beta';
        }

        return {
          version: nextVersionNumber,
          version_code: nextVersionCode
        };
      } catch (error) {
        console.error('Error generating next version:', error);
        throw error;
      }
    }

    // NEW: Parse version string into components
    static parseVersion(versionString) {
      const [baseVersion, type = 'release'] = versionString.split('-');
      const [major, minor, patch] = baseVersion.split('.').map(part => parseInt(part) || 0);
      
      return {
        major: major || 0,
        minor: minor || 0,
        patch: patch || 0,
        type: type
      };
    }

    // NEW: Get version breakdown for current instance
    getVersionBreakdown() {
      return GameVersion.parseVersion(this.version);
    }

    // NEW: Check if this version is newer than another version string
    isNewerThan(otherVersionString) {
      const thisVersion = this.getVersionBreakdown();
      const otherVersion = GameVersion.parseVersion(otherVersionString);
      
      if (thisVersion.major > otherVersion.major) return true;
      if (thisVersion.major < otherVersion.major) return false;
      
      if (thisVersion.minor > otherVersion.minor) return true;
      if (thisVersion.minor < otherVersion.minor) return false;
      
      return thisVersion.patch > otherVersion.patch;
    }

    // NEW: Verify file exists on filesystem
    async fileExists() {
      try {
        const fs = require('fs').promises;
        await fs.access(this.file_path);
        return true;
      } catch (error) {
        return false;
      }
    }
  }

  GameVersion.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
        isValidVersion(value) {
          if (!value.match(/^\d+\.\d+\.\d+(-beta)?$/)) {
            throw new Error('Version must be in format: major.minor.patch or major.minor.patch-beta');
          }
        }
      }
    },
    version_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        isInt: true,
        min: 1
      }
    },
    release_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 5000]
      }
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1
      }
    },
    md5_hash: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        is: /^[a-f0-9]{32}$/i,
        len: [32, 32]
      }
    },
    min_android_version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '7.0',
      validate: {
        is: /^\d+(\.\d+)*$/
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_beta: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    download_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0
      }
    },
    changelog: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Structured changelog data'
    },
    supported_architectures: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
      comment: 'Supported Android architectures'
    },
    requirements: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'System requirements'
    }
  }, {
    sequelize,
    modelName: 'GameVersion',
    tableName: 'game_versions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['version']
      },
      {
        unique: true,
        fields: ['version_code']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_beta']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['download_count']
      }
    ],
    hooks: {
      beforeValidate: (gameVersion) => {
        // Ensure min_android_version is properly formatted
        if (gameVersion.min_android_version && !gameVersion.min_android_version.match(/^\d+(\.\d+)*$/)) {
          throw new Error('Invalid Android version format');
        }
      },
      beforeDestroy: async (gameVersion) => {
        // Prevent deletion of active versions
        if (gameVersion.is_active) {
          throw new Error('Cannot delete active game version. Deactivate it first.');
        }
      }
    }
  });

  return GameVersion;
};