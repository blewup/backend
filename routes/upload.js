const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');

// Enhanced security configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and use UUID to prevent injection attacks
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const uniqueName = `${uuidv4()}_${safeName}`;
    cb(null, uniqueName);
  }
});

// Enhanced file filter with MIME type validation
const fileFilter = (req, file, cb) => {
  try {
    const { Upload } = req.app.get('models');
    
    // Check if MIME type is allowed
    if (!Upload.isAllowedMimeType(file.mimetype)) {
      return cb(new Error(`Blocked file type: ${file.mimetype}. Only approved images and videos are allowed.`), false);
    }

    // Validate file extension matches MIME type
    if (!Upload.validateFileExtension(file.originalname, file.mimetype)) {
      return cb(new Error(`File extension doesn't match MIME type. Possible file spoofing.`), false);
    }

    // Additional security checks based on file type
    if (file.mimetype.startsWith('image/')) {
      if (file.mimetype === 'image/svg+xml') {
        console.warn('SVG file uploaded - consider sanitizing');
      }
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Configure multer with security limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 64 * 1024 * 1024, // 64MB limit
    files: 5, // Reduced from 10 to 5 for security
    fields: 10, // Limit form fields
    parts: 20 // Limit total parts (files + fields)
  }
});

// Utility function to calculate file hash
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

// Utility function to get file URL
const getFileUrl = (filename) => {
  return `/api/uploads/${filename}`;
};

// Enhanced file type validation
const validateFileType = (mimetype, fileType) => {
  const imageMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 
    'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'
  ];
  const videoMimes = [
    'video/mp4', 'video/mpeg', 'video/quicktime', 
    'video/webm', 'video/x-msvideo'
  ];
  
  if (fileType === 'gif' && mimetype !== 'image/gif') {
    throw new Error('GIF file type must be image/gif');
  }
  
  if (fileType === 'clip' && !videoMimes.includes(mimetype)) {
    throw new Error('Clip file type must be a video');
  }
  
  if (fileType === 'profile' && !imageMimes.includes(mimetype)) {
    throw new Error('Profile file type must be an image');
  }
  
  return true;
};

// Basic virus scan simulation
const simulateVirusScan = async (filePath) => {
  const stats = await fs.promises.stat(filePath);
  
  const buffer = Buffer.alloc(1024);
  const fd = await fs.promises.open(filePath, 'r');
  await fd.read(buffer, 0, 1024, 0);
  await fd.close();
  
  const fileHeader = buffer.toString('hex');
  
  if (fileHeader.includes('4d5a') || fileHeader.includes('5045')) {
    return { clean: false, reason: 'Executable content detected in media file' };
  }
  
  return { clean: true };
};

// @route   POST /api/upload
// @desc    Upload single file with enhanced security
// @access  Private
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  let fileHash = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { Upload } = req.app.get('models');
    const { file_type = 'social', description = '', is_public = true } = req.body;

    // Validate file type consistency
    try {
      validateFileType(req.file.mimetype, file_type);
    } catch (error) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Calculate file hash for tracking and duplicate detection
    try {
      fileHash = await calculateFileHash(req.file.path);
      
      const existingFile = await Upload.findOne({ where: { sha256_hash: fileHash } });
      if (existingFile) {
        console.warn(`Duplicate file detected: ${fileHash}`);
      }
    } catch (hashError) {
      console.error('Error calculating file hash:', hashError);
    }

    // Perform basic virus scan
    let scanResult = 'pending';
    try {
      const scan = await simulateVirusScan(req.file.path);
      scanResult = scan.clean ? 'clean' : 'infected';
      
      if (!scan.clean) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'File rejected by security scan',
          reason: scan.reason
        });
      }
    } catch (scanError) {
      console.error('Virus scan error:', scanError);
      scanResult = 'error';
    }

    // Create upload record
    const uploadRecord = await Upload.create({
      user_id: req.user.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: getFileUrl(req.file.filename),
      file_type,
      description: description.substring(0, 1000),
      is_public: is_public === 'true',
      virus_scanned: scanResult !== 'pending',
      scan_result: scanResult,
      sha256_hash: fileHash,
      metadata: {
        encoding: req.file.encoding,
        fieldname: req.file.fieldname,
        user_agent: req.get('User-Agent'),
        upload_time: new Date().toISOString()
      }
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      scan_status: scanResult,
      data: uploadRecord
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Upload error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { Upload } = req.app.get('models');
    const { file_type = 'social', description = '', is_public = true } = req.body;
    const uploads = [];

    for (const file of req.files) {
      try {
        validateFileType(file.mimetype, file_type);
        
        const fileHash = await calculateFileHash(file.path);
        const scan = await simulateVirusScan(file.path);
        
        if (!scan.clean) {
          fs.unlinkSync(file.path);
          continue;
        }

        const uploadRecord = await Upload.create({
          user_id: req.user.id,
          filename: file.filename,
          original_name: file.originalname,
          mime_type: file.mimetype,
          size: file.size,
          path: file.path,
          url: getFileUrl(file.filename),
          file_type,
          description: description.substring(0, 1000),
          is_public: is_public === 'true',
          virus_scanned: true,
          scan_result: scan.clean ? 'clean' : 'infected',
          sha256_hash: fileHash,
          metadata: {
            encoding: file.encoding,
            fieldname: file.fieldname,
            user_agent: req.get('User-Agent'),
            upload_time: new Date().toISOString()
          }
        });

        uploads.push(uploadRecord);
      } catch (error) {
        fs.unlinkSync(file.path);
        console.error(`Error processing file ${file.originalname}:`, error);
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploads.length} files uploaded successfully`,
      data: uploads
    });

  } catch (error) {
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/upload/user
// @desc    Get user's uploads
// @access  Private
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { Upload } = req.app.get('models');
    const { page = 1, limit = 20, file_type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: req.user.id, is_deleted: false };
    if (file_type) {
      whereClause.file_type = file_type;
    }

    const uploads = await Upload.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        uploads: uploads.rows,
        total: uploads.count,
        page: parseInt(page),
        total_pages: Math.ceil(uploads.count / limit)
      }
    });

  } catch (error) {
    console.error('Get user uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching uploads'
    });
  }
});

// @route   GET /api/upload/public
// @desc    Get public uploads
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { Upload } = req.app.get('models');
    const { page = 1, limit = 20, file_type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { is_public: true, is_deleted: false };
    if (file_type) {
      whereClause.file_type = file_type;
    }

    const uploads = await Upload.findAndCountAll({
      where: whereClause,
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
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        uploads: uploads.rows,
        total: uploads.count,
        page: parseInt(page),
        total_pages: Math.ceil(uploads.count / limit)
      }
    });

  } catch (error) {
    console.error('Get public uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public uploads'
    });
  }
});

// @route   GET /api/upload/:id
// @desc    Get specific upload
// @access  Private (or public if upload is public)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { Upload } = req.app.get('models');
    const upload = await Upload.findByPk(req.params.id, {
      include: [
        {
          association: 'user',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }
      ]
    });

    if (!upload || upload.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    if (upload.user_id !== req.user.id && !upload.is_public) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: upload
    });

  } catch (error) {
    console.error('Get upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upload'
    });
  }
});

// @route   PUT /api/upload/:id
// @desc    Update upload details
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { Upload } = req.app.get('models');
    const { description, is_public } = req.body;
    
    const upload = await Upload.findByPk(req.params.id);

    if (!upload || upload.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    if (upload.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await upload.update({
      description: description !== undefined ? description.substring(0, 1000) : upload.description,
      is_public: is_public !== undefined ? is_public : upload.is_public
    });

    res.json({
      success: true,
      message: 'Upload updated successfully',
      data: upload
    });

  } catch (error) {
    console.error('Update upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating upload'
    });
  }
});

// @route   DELETE /api/upload/:id
// @desc    Delete upload (soft delete)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { Upload } = req.app.get('models');
    const upload = await Upload.findByPk(req.params.id);

    if (!upload || upload.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    if (upload.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete instead of physical deletion
    await upload.softDelete();

    res.json({
      success: true,
      message: 'Upload deleted successfully'
    });

  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting upload'
    });
  }
});

// @route   GET /api/upload/allowed-types
// @desc    Get allowed file types and MIME types
// @access  Public
router.get('/allowed-types', async (req, res) => {
  try {
    const { Upload } = req.app.get('models');
    res.json({
      success: true,
      data: {
        allowed_mime_types: Upload.getAllowedMimeTypes(),
        allowed_file_types: Upload.getAllowedFileTypes(),
        max_file_size: '64MB',
        max_files_per_request: 5
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching allowed types'
    });
  }
});

// Enhanced error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 64MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files per request.'
      });
    }
  }
  
  if (error.message.includes('Blocked file type') || 
      error.message.includes('File extension') ||
      error.message.includes('Possible file spoofing')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'SECURITY_VALIDATION_FAILED'
    });
  }

  console.error('Upload route error:', error);
  res.status(500).json({
    success: false,
    message: 'Upload failed',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;