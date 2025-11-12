const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Upload extends Model {
    static associate(models) {
      // Associate with User model
      Upload.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    // Instance method to safely return upload data
    toJSON() {
      const values = { ...this.get() };
      delete values.path; // Don't expose server file paths
      return values;
    }
  }

  // Define allowed MIME types for security
  const ALLOWED_MIME_TYPES = [
    // Safe image types
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    
    // Safe video types (restricted codecs)
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo' // AVI
  ];

  const ALLOWED_FILE_TYPES = ['profile', 'social', 'gif', 'clip', 'other'];

  Upload.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    mime_type: {
      type: DataTypes.ENUM(ALLOWED_MIME_TYPES),
      allowNull: false,
      validate: {
        isIn: [ALLOWED_MIME_TYPES]
      }
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 64 * 1024 * 1024 // 64MB
      }
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    file_type: {
      type: DataTypes.ENUM(ALLOWED_FILE_TYPES),
      defaultValue: 'social',
      validate: {
        isIn: [ALLOWED_FILE_TYPES]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000] // Limit description length
      }
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    virus_scanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    scan_result: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['clean', 'infected', 'pending', 'error']]
      }
    },
    sha256_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      validate: {
        is: /^[a-f0-9]{64}$/i // SHA256 hash format
      }
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Upload',
    tableName: 'uploads',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['file_type']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['virus_scanned']
      },
      {
        fields: ['sha256_hash']
      },
      {
        fields: ['is_deleted']
      }
    ]
  });

  // Static methods
  Upload.isAllowedMimeType = function(mimeType) {
    return ALLOWED_MIME_TYPES.includes(mimeType);
  };

  Upload.getAllowedMimeTypes = function() {
    return [...ALLOWED_MIME_TYPES];
  };

  Upload.getAllowedFileTypes = function() {
    return [...ALLOWED_FILE_TYPES];
  };

  // MIME type to file extension mapping for validation
  Upload.MIME_TO_EXTENSION = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/bmp': ['.bmp'],
    'image/svg+xml': ['.svg'],
    'video/mp4': ['.mp4'],
    'video/mpeg': ['.mpeg', '.mpg'],
    'video/quicktime': ['.mov', '.qt'],
    'video/webm': ['.webm'],
    'video/x-msvideo': ['.avi']
  };

  // Validate file extension matches MIME type
  Upload.validateFileExtension = function(filename, mimeType) {
    const extension = require('path').extname(filename).toLowerCase();
    const allowedExtensions = Upload.MIME_TO_EXTENSION[mimeType];
    
    if (!allowedExtensions) {
      return false;
    }
    
    return allowedExtensions.includes(extension);
  };

  // Instance method to mark as scanned
  Upload.prototype.markAsScanned = function(result, hash = null) {
    return this.update({
      virus_scanned: true,
      scan_result: result,
      sha256_hash: hash
    });
  };

  // Find by user with pagination
  Upload.findByUser = function(userId, options = {}) {
    return this.findAll({
      where: { 
        user_id: userId,
        is_deleted: false 
      },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  // Find public uploads
  Upload.findPublic = function(options = {}) {
    return this.findAll({
      where: { 
        is_public: true,
        is_deleted: false 
      },
      include: [
        {
          association: 'user',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          where: {
            is_active: true,
            is_deleted: false
          }
        }
      ],
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  // Find files that haven't been virus scanned
  Upload.findUnscanned = function(limit = 100) {
    return this.findAll({
      where: {
        virus_scanned: false,
        is_deleted: false
      },
      limit: limit,
      order: [['created_at', 'ASC']]
    });
  };

  // Soft delete method
  Upload.prototype.softDelete = function() {
    return this.update({
      is_deleted: true,
      updated_at: new Date()
    });
  };

  return Upload;
};