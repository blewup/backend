const express = require('express');
const { User, UserProfile, UserSocialProfile, UserLocation, Upload } = require('../models');
const { Op } = require('sequelize');
const { userValidation } = require('../schemas/validationSchemas');
const validate = require('../middleware/validate');
const router = express.Router();

// Search users by name or username
router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            const error = new Error('Query too short');
            error.status = 400;
            throw error;
        }

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { username: { [Op.like]: `%${q}%` } },
                    { first_name: { [Op.like]: `%${q}%` } },
                    { last_name: { [Op.like]: `%${q}%` } }
                ],
                is_active: true,
                is_deleted: false
            },
            attributes: ['id', 'username', 'first_name', 'last_name', 'created_at'],
            include: [
                {
                    model: UserProfile,
                    as: 'profile',
                    attributes: ['bio', 'portrait_url', 'cover_url']
                }
            ],
            limit: 20,
            order: [['username', 'ASC']]
        });

        res.json({
            success: true,
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                bio: user.profile?.bio,
                portrait_url: user.profile?.portrait_url,
                cover_url: user.profile?.cover_url
            }))
        });
    } catch (error) {
        next(error);
    }
});

// Get a single user's public profile
router.get('/:username', async (req, res) => {
    try {
        const user = await User.scope('publicProfile').findOne({
            where: { 
                username: req.params.username,
                is_active: true,
                is_deleted: false
            },
            include: [
                { 
                    model: UserProfile, 
                    as: 'profile',
                    attributes: ['display_name', 'website', 'game_stats']
                },
                {
                    model: UserSocialProfile,
                    as: 'socialProfiles',
                    where: { is_public: true },
                    required: false,
                    attributes: ['platform', 'profile_url', 'username']
                },
                {
                    model: Upload,
                    as: 'uploads',
                    where: { 
                        is_public: true,
                        is_deleted: false,
                        file_type: ['profile', 'social']
                    },
                    required: false,
                    attributes: ['id', 'filename', 'url', 'file_type', 'description', 'created_at'],
                    limit: 10,
                    order: [['created_at', 'DESC']]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found.' 
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching user profile.', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user's own complete profile (requires authentication)
router.get('/profile/me', async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] },
            include: [
                { 
                    model: UserProfile, 
                    as: 'profile',
                    attributes: ['id', 'display_name', 'website', 'privacy_settings', 'notification_settings', 'game_stats']
                },
                {
                    model: UserSocialProfile,
                    as: 'socialProfiles',
                    attributes: ['id', 'platform', 'profile_url', 'username', 'is_public']
                },
                {
                    model: UserLocation,
                    as: 'locations',
                    attributes: ['id', 'address_type', 'city', 'state_province', 'country', 'is_primary', 'is_public']
                },
                {
                    model: Upload,
                    as: 'uploads',
                    where: { is_deleted: false },
                    required: false,
                    attributes: ['id', 'filename', 'url', 'file_type', 'description', 'size', 'is_public', 'created_at'],
                    order: [['created_at', 'DESC']]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Search users by username or display name
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { limit = 20, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const { count, rows } = await User.findAndCountAll({
            where: {
                [Op.or]: [
                    { username: { [Op.like]: `%${query}%` } },
                    { first_name: { [Op.like]: `%${query}%` } },
                    { last_name: { [Op.like]: `%${query}%` } },
                    { '$profile.display_name$': { [Op.like]: `%${query}%` } }
                ],
                is_active: true,
                is_deleted: false
            },
            attributes: ['id', 'username', 'first_name', 'last_name', 'profile_picture', 'profile_picture_type', 'created_at'],
            include: [
                {
                    model: UserProfile,
                    as: 'profile',
                    attributes: ['display_name']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['username', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                users: rows,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error searching users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user's uploads
router.get('/:username/uploads', async (req, res) => {
    try {
        const { username } = req.params;
        const { file_type, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const user = await User.findOne({
            where: { 
                username,
                is_active: true,
                is_deleted: false 
            },
            attributes: ['id']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const whereClause = { 
            user_id: user.id,
            is_deleted: false 
        };

        // Check if requesting user is the profile owner
        const isOwner = req.user && req.user.id === user.id;
        
        if (!isOwner) {
            whereClause.is_public = true;
        }

        if (file_type) {
            whereClause.file_type = file_type;
        }

        const { count, rows: uploads } = await Upload.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'filename', 'url', 'file_type', 'description', 'size', 'mime_type', 'is_public', 'created_at'],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                uploads,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit),
                isOwner
            }
        });
    } catch (error) {
        console.error('Error fetching user uploads:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user uploads',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update user profile (partial update)
router.patch('/profile', [validate(userValidation.update)], async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const allowedFields = [
            'first_name', 'last_name', 'date_of_birth', 'biography', 
            'preferred_gameplay_type', 'profile_picture', 'profile_picture_type',
            'cover_photo', 'cover_photo_type'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.update(updateData);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;