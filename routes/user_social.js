const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../models');

// Get user's social profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: db.UserProfile,
          as: 'profile',
          attributes: ['display_name', 'website', 'privacy_settings', 'notification_settings', 'game_stats']
        },
        {
          model: db.UserSocialProfile,
          as: 'socialProfiles',
          attributes: ['id', 'platform', 'profile_url', 'username', 'is_public']
        },
        {
          model: db.UserLocation,
          as: 'locations',
          attributes: ['id', 'address_type', 'city', 'state_province', 'country', 'is_public']
        }
      ]
    });

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        biography: user.biography,
        preferred_gameplay_type: user.preferred_gameplay_type,
        profile_picture_type: user.profile_picture_type,
        last_login: user.last_login,
        created_at: user.created_at
      },
      profile: user.profile,
      social_profiles: user.socialProfiles,
      locations: user.locations
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      biography,
      preferred_gameplay_type,
      display_name,
      website,
      privacy_settings,
      notification_settings
    } = req.body;

    const user = await db.User.findByPk(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Update user fields
    await user.update({
      first_name,
      last_name,
      biography,
      preferred_gameplay_type
    });

    // Update or create user profile
    const [userProfile] = await db.UserProfile.findOrCreate({
      where: { user_id: req.userId },
      defaults: { user_id: req.userId }
    });

    await userProfile.update({
      display_name,
      website,
      privacy_settings,
      notification_settings
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'profile_update',
      activity_description: 'Updated profile information',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'Profile updated successfully', user, profile: userProfile });
  } catch (error) {
    next(error);
  }
});

// Add social profile
router.post('/social-profiles', authenticateToken, async (req, res, next) => {
  try {
    const { platform, profile_url, username, is_public = true } = req.body;

    const socialProfile = await db.UserSocialProfile.create({
      user_id: req.userId,
      platform,
      profile_url,
      username,
      is_public
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'profile_update',
      activity_description: `Added ${platform} social profile`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { platform, profile_url }
    });

    res.status(201).json(socialProfile);
  } catch (error) {
    next(error);
  }
});

// Delete social profile
router.delete('/social-profiles/:id', authenticateToken, async (req, res, next) => {
  try {
    const socialProfile = await db.UserSocialProfile.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId
      }
    });

    if (!socialProfile) {
      const error = new Error('Social profile not found');
      error.status = 404;
      throw error;
    }

    await socialProfile.destroy();

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'profile_update',
      activity_description: `Removed ${socialProfile.platform} social profile`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({ message: 'Social profile deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get public profile by username
router.get('/profiles/:username', async (req, res, next) => {
  try {
    const user = await db.User.findOne({
      where: { username: req.params.username, is_active: true, is_deleted: false },
      attributes: ['id', 'username', 'biography', 'preferred_gameplay_type', 'created_at'],
      include: [
        {
          model: db.UserProfile,
          as: 'profile',
          attributes: ['display_name', 'website', 'game_stats']
        },
        {
          model: db.UserSocialProfile,
          as: 'socialProfiles',
          where: { is_public: true },
          attributes: ['platform', 'profile_url', 'username'],
          required: false
        },
        {
          model: db.UserLocation,
          as: 'locations',
          where: { is_public: true },
          attributes: ['city', 'state_province', 'country'],
          required: false
        }
      ]
    });

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;