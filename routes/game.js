const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');
const db = require('../models');

// Configure multer for file uploads with optimized settings
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      let uploadDir;
      
      // Different directories for different file types
      if (file.fieldname === 'game_file') {
        uploadDir = path.join(__dirname, '../uploads/game/versions');
      } else if (['cover_image', 'portrait_image', 'screenshots'].includes(file.fieldname)) {
        uploadDir = path.join(__dirname, '../uploads/game/assets');
      } else {
        uploadDir = path.join(__dirname, '../uploads/game/temp');
      }
      
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    
    let prefix = 'file';
    if (file.fieldname === 'game_file') prefix = 'game';
    else if (file.fieldname === 'cover_image') prefix = 'cover';
    else if (file.fieldname === 'portrait_image') prefix = 'portrait';
    else if (file.fieldname === 'screenshots') prefix = 'screenshot';
    
    cb(null, `${prefix}-${uniqueSuffix}${extension}`);
  }
});

// Enhanced file filter with better validation
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const allowedAPKTypes = ['application/vnd.android.package-archive', 'application/octet-stream'];
  
  // APK files for game downloads
  if (file.fieldname === 'game_file') {
    const isAPK = allowedAPKTypes.includes(file.mimetype) || 
                  path.extname(file.originalname).toLowerCase() === '.apk';
    
    if (isAPK) {
      cb(null, true);
    } else {
      cb(new Error('Only APK files are allowed for game downloads. Received: ' + file.mimetype), false);
    }
  } 
  // Image files for assets
  else if (['screenshots', 'cover_image', 'portrait_image'].includes(file.fieldname)) {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files (JPEG, PNG, WebP, GIF) are allowed. Received: ${file.mimetype}`), false);
    }
  } else {
    cb(new Error(`Invalid file field: ${file.fieldname}`), false);
  }
};

// Configure multer with optimized settings
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 64 * 1024 * 1024, // 64MB max
    files: 10, // Max 10 files at once
    fields: 10 // Max 10 form fields
  },
  fileFilter: fileFilter,
  preservePath: false
});

// Enhanced image optimization function
async function optimizeImage(inputPath, outputPath, options) {
  const { 
    width, 
    height, 
    quality = 80, 
    format = 'webp',
    fit = 'inside',
    withoutEnlargement = true
  } = options;
  
  try {
    let sharpInstance = sharp(inputPath)
      .rotate() // Auto-rotate based on EXIF
      .resize(width, height, {
        fit: fit,
        withoutEnlargement: withoutEnlargement,
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
      });
    
    // Apply format-specific optimizations
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ 
          quality: Math.min(100, Math.max(1, quality)),
          progressive: true,
          optimizeScans: true,
          mozjpeg: true // Better compression
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality: Math.min(100, Math.max(1, quality)),
          progressive: true,
          compressionLevel: 9, // Max compression
          palette: true // Use palette for better compression
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality: Math.min(100, Math.max(1, quality)),
          effort: 6, // Max compression effort
          alphaQuality: 80 // Quality for alpha channel
        });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    const result = await sharpInstance.toFile(outputPath);
    
    // Get file stats for additional info
    const stats = await fs.stat(outputPath);
    const originalStats = await fs.stat(inputPath);
    
    return {
      path: outputPath,
      size: stats.size,
      originalSize: originalStats.size,
      format: format,
      dimensions: {
        width: result.width,
        height: result.height
      },
      compressionRatio: Math.round((1 - stats.size / originalStats.size) * 100)
    };
  } catch (error) {
    // Clean up output file if optimization fails
    await fs.unlink(outputPath).catch(() => {});
    throw error;
  }
}

// Get latest game version with enhanced response
router.post('/admin/versions', authenticateToken, requireRole('admin', 'super_admin'), upload.single('game_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Game file is required' });
    }

    const { 
      release_notes, 
      min_android_version = '7.0',
      is_beta = 'false',
      changelog,
      supported_architectures,
      requirements,
      use_auto_version = 'true' // New flag to enable auto-versioning
    } = req.body;

    const useAutoVersion = use_auto_version === 'true';
    const isBeta = is_beta === 'true';

    let version, version_code;

    if (useAutoVersion) {
      // Use automatic version numbering
      const nextVersion = await db.GameVersion.generateNextVersion(isBeta);
      version = nextVersion.version;
      version_code = nextVersion.version_code;
    } else {
      // Use manual version input (backward compatibility)
      version = req.body.version;
      version_code = req.body.version_code;

      if (!version || !version_code) {
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(400).json({ error: 'Version and version code are required when auto-versioning is disabled' });
      }

      // Validate manual version format
      if (!version.match(/^\d+\.\d+\.\d+(-beta)?$/)) {
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(400).json({ error: 'Version must be in format: major.minor.patch or major.minor.patch-beta' });
      }

      // Check for existing version
      const existingVersion = await db.GameVersion.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { version },
            { version_code: parseInt(version_code) }
          ]
        }
      });

      if (existingVersion) {
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(400).json({ 
          error: 'Version or version code already exists',
          existing_version: existingVersion.version
        });
      }
    }

    // Calculate MD5 hash
    const crypto = require('crypto');
    const fileBuffer = await fs.readFile(req.file.path);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // Parse additional data
    let parsedChangelog, parsedArchitectures, parsedRequirements;
    
    try {
      parsedChangelog = changelog ? JSON.parse(changelog) : null;
      parsedArchitectures = supported_architectures ? JSON.parse(supported_architectures) : ['arm64-v8a', 'armeabi-v7a', 'x86_64'];
      parsedRequirements = requirements ? JSON.parse(requirements) : null;
    } catch (parseError) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({ error: 'Invalid JSON in additional fields' });
    }

    const gameVersion = await db.GameVersion.create({
      version,
      version_code,
      release_notes,
      file_path: req.file.path,
      file_size: req.file.size,
      md5_hash: hash,
      min_android_version,
      is_beta: isBeta,
      is_active: true,
      changelog: parsedChangelog,
      supported_architectures: parsedArchitectures,
      requirements: parsedRequirements
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'content_created',
      activity_description: `Uploaded game version ${version} (${version_code}) ${useAutoVersion ? '(auto-generated)' : '(manual)'}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'game_version',
      related_entity_id: gameVersion.id,
      metadata: {
        auto_generated: useAutoVersion,
        version_type: isBeta ? 'beta' : 'release'
      }
    });

    res.status(201).json({
      message: 'Game version uploaded successfully',
      version: {
        id: gameVersion.id,
        version: gameVersion.version,
        version_code: gameVersion.version_code,
        file_size: gameVersion.getFormattedFileSize(),
        md5_hash: gameVersion.md5_hash,
        download_url: gameVersion.getDownloadUrl(),
        auto_generated: useAutoVersion,
        version_breakdown: gameVersion.getVersionBreakdown()
      }
    });
  } catch (error) {
    console.error('Upload game version error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ 
      error: 'Failed to upload game version',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced download endpoint with better tracking
router.get('/download/version', optionalAuth, async (req, res) => {
  try {
    let gameVersion;
    const { track = 'true' } = req.query;
    const shouldTrack = track !== 'false';

    if (req.params.versionId) {
      gameVersion = await db.GameVersion.findByPk(req.params.versionId);
    } else {
      gameVersion = await db.GameVersion.getLatest(false);
    }

    if (!gameVersion) {
      return res.status(404).json({ 
        error: 'Game version not found',
        suggestion: 'Try downloading the latest version without specifying an ID'
      });
    }

    // Verify file exists
    if (!await gameVersion.fileExists()) {
      return res.status(404).json({ 
        error: 'Game file not available on server',
        version: gameVersion.version
      });
    }

    // Track download if enabled
    if (shouldTrack) {
      await db.GameVersion.incrementDownload(gameVersion.id);

      // Create download record
      await db.GameDownload.create({
        user_id: req.userId || null,
        version_id: gameVersion.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        country_code: req.headers['cf-ipcountry'] || null // Cloudflare header
      });

      // Log activity for authenticated users
      if (req.userId) {
        await db.UserActivity.logActivity(req.userId, {
          activity_type: 'item_purchased',
          activity_description: `Downloaded game version ${gameVersion.version}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          related_entity_type: 'game_version',
          related_entity_id: gameVersion.id
        });
      }
    }

    // Set download headers
    const filename = `Kusher_Space_v${gameVersion.version}.apk`;
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', gameVersion.file_size);
    res.setHeader('X-File-Hash', gameVersion.md5_hash);
    res.setHeader('X-Version', gameVersion.version);
    res.setHeader('X-Version-Code', gameVersion.version_code);
    res.setHeader('Cache-Control', 'no-cache'); // Prevent caching of download

    // Stream the file with error handling
    const fileStream = require('fs').createReadStream(gameVersion.file_path);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream game file' });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('Download game error:', error);
    res.status(500).json({ 
      error: 'Failed to download game',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced assets endpoint with pagination and filtering
router.get('/assets', async (req, res) => {
  try {
    const { 
      type, 
      limit = 50, 
      page = 1,
      include_private = 'false',
      sort_by = 'order_index',
      sort_order = 'ASC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const includePrivate = include_private === 'true';

    const whereCondition = {};
    if (type) whereCondition.asset_type = type;
    if (!includePrivate) whereCondition.is_public = true;

    const { count, rows: assets } = await db.GameAsset.findAndCountAll({
      where: whereCondition,
      order: [
        [sort_by, sort_order.toUpperCase()],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'asset_type', 'original_filename', 'optimized_path', 'file_path',
        'file_size', 'optimized_size', 'dimensions', 'order_index', 
        'is_public', 'alt_text', 'created_at'
      ]
    });

    const assetsWithUrls = assets.map(asset => ({
      ...asset.toJSON(),
      url: asset.getPublicUrl(),
      thumbnail_url: asset.getThumbnailUrl(),
      optimized_url: asset.getOptimizedUrl(),
      formatted_size: asset.getFormattedFileSize(),
      formatted_optimized_size: asset.getFormattedFileSize(true),
      compression_ratio: asset.compression_ratio
    }));

    res.json({
      assets: assetsWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit),
        has_next: page * limit < count,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Get game assets error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch game assets',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Serve optimized asset file with cache headers
router.get('/assets/:assetId/optimized', async (req, res) => {
  try {
    const asset = await db.GameAsset.findByPk(req.params.assetId);
    
    if (!asset || !asset.is_public) {
      return res.status(404).json({ error: 'Asset not found or not publicly accessible' });
    }

    if (!asset.optimized_path) {
      return res.redirect(`/api/game/assets/${asset.id}/file`);
    }

    // Verify optimized file exists
    if (!await asset.fileExists()) {
      return res.status(404).json({ error: 'Optimized asset file not found' });
    }

    // Set cache headers (1 year for optimized assets)
    res.setHeader('Content-Type', asset.mime_type);
    res.setHeader('Content-Length', asset.optimized_size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"${asset.id}-${asset.updated_at.getTime()}"`);
    
    // Check for cache validation
    const clientETag = req.headers['if-none-match'];
    if (clientETag === res.getHeader('ETag')) {
      return res.status(304).end(); // Not Modified
    }

    const fileStream = require('fs').createReadStream(asset.optimized_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Serve optimized asset error:', error);
    res.status(500).json({ error: 'Failed to serve optimized asset' });
  }
});

// Serve original asset file
router.get('/assets/:assetId/file', async (req, res) => {
  try {
    const asset = await db.GameAsset.findByPk(req.params.assetId);
    
    if (!asset || !asset.is_public) {
      return res.status(404).json({ error: 'Asset not found or not publicly accessible' });
    }

    // Verify file exists
    if (!await asset.fileExists()) {
      return res.status(404).json({ error: 'Asset file not found' });
    }

    // Set cache headers (shorter cache for original files)
    res.setHeader('Content-Type', asset.mime_type);
    res.setHeader('Content-Length', asset.file_size);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
    res.setHeader('ETag', `"${asset.id}-original-${asset.updated_at.getTime()}"`);

    const fileStream = require('fs').createReadStream(asset.file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Serve asset error:', error);
    res.status(500).json({ error: 'Failed to serve asset' });
  }
});

// Admin: Upload game version with enhanced validation
router.post('/admin/versions', authenticateToken, requireRole('admin', 'super_admin'), upload.single('game_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Game file is required' });
    }

    const { 
      version, 
      version_code, 
      release_notes, 
      min_android_version = '7.0',
      is_beta = 'false',
      changelog,
      supported_architectures,
      requirements
    } = req.body;

    // Validate required fields
    if (!version || !version_code) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({ error: 'Version and version code are required' });
    }

    // Validate version format
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({ error: 'Version must be in format: major.minor.patch' });
    }

    // Check for existing version
    const existingVersion = await db.GameVersion.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { version },
          { version_code: parseInt(version_code) }
        ]
      }
    });

    if (existingVersion) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({ 
        error: 'Version or version code already exists',
        existing_version: existingVersion.version
      });
    }

    // Calculate MD5 hash
    const crypto = require('crypto');
    const fileBuffer = await fs.readFile(req.file.path);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // Parse additional data
    let parsedChangelog, parsedArchitectures, parsedRequirements;
    
    try {
      parsedChangelog = changelog ? JSON.parse(changelog) : null;
      parsedArchitectures = supported_architectures ? JSON.parse(supported_architectures) : ['arm64-v8a', 'armeabi-v7a', 'x86_64'];
      parsedRequirements = requirements ? JSON.parse(requirements) : null;
    } catch (parseError) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({ error: 'Invalid JSON in additional fields' });
    }

    const gameVersion = await db.GameVersion.create({
      version,
      version_code: parseInt(version_code),
      release_notes,
      file_path: req.file.path,
      file_size: req.file.size,
      md5_hash: hash,
      min_android_version,
      is_beta: is_beta === 'true',
      is_active: true,
      changelog: parsedChangelog,
      supported_architectures: parsedArchitectures,
      requirements: parsedRequirements
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'content_created',
      activity_description: `Uploaded game version ${version} (${version_code})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'game_version',
      related_entity_id: gameVersion.id
    });

    res.status(201).json({
      message: 'Game version uploaded successfully',
      version: {
        id: gameVersion.id,
        version: gameVersion.version,
        version_code: gameVersion.version_code,
        file_size: gameVersion.getFormattedFileSize(),
        md5_hash: gameVersion.md5_hash,
        download_url: gameVersion.getDownloadUrl()
      }
    });
  } catch (error) {
    console.error('Upload game version error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ 
      error: 'Failed to upload game version',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin: Upload game assets with enhanced processing
router.post('/admin/assets', authenticateToken, requireRole('admin', 'super_admin'), upload.fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'portrait_image', maxCount: 1 },
  { name: 'screenshots', maxCount: 12 }
]), async (req, res) => {
  try {
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { 
      alt_text,
      screenshot_alt_texts = '[]'
    } = req.body;

    const uploadedAssets = [];
    const errors = [];
    const processedFiles = new Set(); // Track files for cleanup

    // Parse screenshot alt texts
    let parsedAltTexts = [];
    try {
      parsedAltTexts = JSON.parse(screenshot_alt_texts);
    } catch {
      // Ignore parse errors, use empty array
    }

    // Process cover image
    if (files.cover_image) {
      try {
        const coverFile = files.cover_image[0];
        processedFiles.add(coverFile.path);
        
        const optimizedPath = coverFile.path + '_optimized.webp';
        
        const optimized = await optimizeImage(coverFile.path, optimizedPath, {
          width: 1920,
          height: 1080,
          quality: 85,
          format: 'webp'
        });

        const coverAsset = await db.GameAsset.create({
          asset_type: 'cover',
          original_filename: coverFile.originalname,
          file_path: coverFile.path,
          optimized_path: optimized.path,
          file_size: coverFile.size,
          optimized_size: optimized.size,
          mime_type: 'image/webp',
          dimensions: optimized.dimensions,
          is_public: true,
          order_index: 0,
          alt_text: alt_text || `Kusher Space Cover Image`
        });

        uploadedAssets.push(coverAsset);
      } catch (error) {
        errors.push(`Cover image: ${error.message}`);
      }
    }

    // Process portrait image
    if (files.portrait_image) {
      try {
        const portraitFile = files.portrait_image[0];
        processedFiles.add(portraitFile.path);
        
        const optimizedPath = portraitFile.path + '_optimized.webp';
        
        const optimized = await optimizeImage(portraitFile.path, optimizedPath, {
          width: 1080,
          height: 1920,
          quality: 90,
          format: 'webp'
        });

        const portraitAsset = await db.GameAsset.create({
          asset_type: 'portrait',
          original_filename: portraitFile.originalname,
          file_path: portraitFile.path,
          optimized_path: optimized.path,
          file_size: portraitFile.size,
          optimized_size: optimized.size,
          mime_type: 'image/webp',
          dimensions: optimized.dimensions,
          is_public: true,
          order_index: 0,
          alt_text: alt_text || `Kusher Space Portrait Image`
        });

        uploadedAssets.push(portraitAsset);
      } catch (error) {
        errors.push(`Portrait image: ${error.message}`);
      }
    }

    // Process screenshots
    if (files.screenshots) {
      for (let i = 0; i < files.screenshots.length; i++) {
        try {
          const screenshotFile = files.screenshots[i];
          processedFiles.add(screenshotFile.path);
          
          const optimizedPath = screenshotFile.path + '_optimized.webp';
          
          const optimized = await optimizeImage(screenshotFile.path, optimizedPath, {
            width: 1280,
            height: 720,
            quality: 80,
            format: 'webp'
          });

          const screenshotAsset = await db.GameAsset.create({
            asset_type: 'screenshot',
            original_filename: screenshotFile.originalname,
            file_path: screenshotFile.path,
            optimized_path: optimized.path,
            file_size: screenshotFile.size,
            optimized_size: optimized.size,
            mime_type: 'image/webp',
            dimensions: optimized.dimensions,
            is_public: true,
            order_index: i,
            alt_text: parsedAltTexts[i] || `Kusher Space Screenshot ${i + 1}`
          });

          uploadedAssets.push(screenshotAsset);
        } catch (error) {
          errors.push(`Screenshot ${i + 1}: ${error.message}`);
        }
      }
    }

    // Clean up any files that weren't processed due to errors
    for (const field in files) {
      for (const file of files[field]) {
        if (!processedFiles.has(file.path)) {
          await fs.unlink(file.path).catch(console.error);
        }
      }
    }

    // Log activity
    if (uploadedAssets.length > 0) {
      await db.UserActivity.logActivity(req.userId, {
        activity_type: 'content_created',
        activity_description: `Uploaded ${uploadedAssets.length} game assets`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        metadata: {
          asset_types: [...new Set(uploadedAssets.map(asset => asset.asset_type))],
          total_size: uploadedAssets.reduce((sum, asset) => sum + asset.file_size, 0),
          optimized_size: uploadedAssets.reduce((sum, asset) => sum + (asset.optimized_size || 0), 0)
        }
      });
    }

    const response = {
      message: `Successfully uploaded ${uploadedAssets.length} assets`,
      uploaded_assets: uploadedAssets.map(asset => ({
        id: asset.id,
        type: asset.asset_type,
        url: asset.getPublicUrl(),
        thumbnail_url: asset.getThumbnailUrl(),
        original_size: asset.getFormattedFileSize(),
        optimized_size: asset.getFormattedFileSize(true),
        compression_ratio: asset.compression_ratio
      })),
      total_compression_saved: uploadedAssets.reduce((sum, asset) => 
        sum + (asset.file_size - (asset.optimized_size || asset.file_size)), 0
      )
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.warning = `${errors.length} files failed to process`;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Upload game assets error:', error);
    
    // Clean up all uploaded files on error
    if (req.files) {
      for (const field in req.files) {
        for (const file of req.files[field]) {
          await fs.unlink(file.path).catch(console.error);
        }
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to upload game assets',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin: Get all game versions with pagination
router.get('/admin/versions', authenticateToken, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      include_inactive = 'false',
      sort_by = 'version_code',
      sort_order = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const includeInactive = include_inactive === 'true';

    const whereCondition = {};
    if (!includeInactive) whereCondition.is_active = true;

    const { count, rows: versions } = await db.GameVersion.findAndCountAll({
      where: whereCondition,
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: db.GameDownload,
        as: 'downloads',
        attributes: [],
        required: false
      }],
      attributes: {
        include: [
          [db.sequelize.fn('COUNT', db.sequelize.col('downloads.id')), 'total_downloads']
        ]
      },
      group: ['GameVersion.id'],
      subQuery: false
    });

    const versionsWithStats = versions.map(version => ({
      ...version.toJSON(),
      download_url: version.getDownloadUrl(),
      formatted_file_size: version.getFormattedFileSize(),
      is_latest: false // This would need additional query to determine
    }));

    res.json({
      versions: versionsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count.length,
        total_pages: Math.ceil(count.length / limit)
      }
    });
  } catch (error) {
    console.error('Get all versions error:', error);
    res.status(500).json({ error: 'Failed to fetch game versions' });
  }
});

// Admin: Toggle version active status
router.put('/admin/versions/:id/status', authenticateToken, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const version = await db.GameVersion.findByPk(req.params.id);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const newStatus = !version.is_active;
    await version.update({ is_active: newStatus });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'settings_updated',
      activity_description: `${newStatus ? 'Activated' : 'Deactivated'} game version ${version.version}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'game_version',
      related_entity_id: version.id
    });

    res.json({
      message: `Version ${version.version} ${newStatus ? 'activated' : 'deactivated'}`,
      version: {
        id: version.id,
        version: version.version,
        is_active: newStatus,
        download_url: version.getDownloadUrl()
      }
    });
  } catch (error) {
    console.error('Toggle version status error:', error);
    res.status(500).json({ error: 'Failed to update version status' });
  }
});

// Enhanced game statistics
router.get('/stats', async (req, res) => {
  try {
    const { time_range = 'all' } = req.query;

    // Get basic stats
    const totalDownloads = await db.GameVersion.sum('download_count') || 0;
    const latestVersion = await db.GameVersion.getLatest(false);
    const totalAssets = await db.GameAsset.count({ where: { is_public: true } });
    
    // Get download statistics
    const downloadStats = await db.GameDownload.getDownloadStats(time_range);
    const popularVersions = await db.GameDownload.getPopularVersions(5);

    // Get storage statistics
    const totalGameSize = await db.GameVersion.sum('file_size') || 0;
    const totalAssetSize = await db.GameAsset.sum('file_size') || 0;
    const totalOptimizedSize = await db.GameAsset.sum('optimized_size') || 0;

    res.json({
      overview: {
        total_downloads: totalDownloads,
        latest_version: latestVersion ? {
          version: latestVersion.version,
          version_code: latestVersion.version_code,
          download_count: latestVersion.download_count,
          release_date: latestVersion.created_at
        } : null,
        total_assets: totalAssets,
        total_versions: await db.GameVersion.count()
      },
      downloads: {
        ...downloadStats,
        popular_versions: popularVersions.map(pv => ({
          version: pv.version.version,
          version_code: pv.version.version_code,
          download_count: pv.dataValues.download_count,
          is_beta: pv.version.is_beta
        }))
      },
      storage: {
        total_game_size: totalGameSize,
        total_asset_size: totalAssetSize,
        total_optimized_size: totalOptimizedSize,
        space_saved: totalAssetSize - totalOptimizedSize,
        formatted: {
          game_size: formatBytes(totalGameSize),
          asset_size: formatBytes(totalAssetSize),
          optimized_size: formatBytes(totalOptimizedSize),
          space_saved: formatBytes(totalAssetSize - totalOptimizedSize)
        }
      },
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({ error: 'Failed to fetch game statistics' });
  }
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router;