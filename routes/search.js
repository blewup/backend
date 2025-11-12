const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Event, Alliance, UserProfile } = require('../models');

// Global search across all entities
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10, sort = 'relevance' } = req.query;
    const offset = (page - 1) * limit;
    const searchQuery = { [Op.iLike]: `%${q}%` };

    // Search users
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: searchQuery },
          { '$profile.bio$': searchQuery }
        ]
      },
      include: [{
        model: UserProfile,
        as: 'profile'
      }],
      limit,
      offset,
      order: sort === 'date' ? [['createdAt', 'DESC']] :
             sort === 'name' ? [['username', 'ASC']] :
             [['username', 'ASC']]
    });

    // Search events
    const events = await Event.findAll({
      where: {
        [Op.or]: [
          { name: searchQuery },
          { description: searchQuery },
          { location: searchQuery }
        ]
      },
      limit,
      offset,
      order: sort === 'date' ? [['start_date', 'DESC']] :
             sort === 'name' ? [['name', 'ASC']] :
             [['createdAt', 'DESC']]
    });

    // Search alliances
    const alliances = await Alliance.findAll({
      where: {
        [Op.or]: [
          { name: searchQuery },
          { description: searchQuery }
        ]
      },
      limit,
      offset,
      order: sort === 'date' ? [['createdAt', 'DESC']] :
             sort === 'name' ? [['name', 'ASC']] :
             [['name', 'ASC']]
    });

    // Get total counts for pagination
    const [userCount, eventCount, allianceCount] = await Promise.all([
      User.count({
        where: {
          [Op.or]: [
            { username: searchQuery },
            { '$profile.bio$': searchQuery }
          ]
        },
        include: [{
          model: UserProfile,
          as: 'profile'
        }]
      }),
      Event.count({
        where: {
          [Op.or]: [
            { name: searchQuery },
            { description: searchQuery },
            { location: searchQuery }
          ]
        }
      }),
      Alliance.count({
        where: {
          [Op.or]: [
            { name: searchQuery },
            { description: searchQuery }
          ]
        }
      })
    ]);

    const totalItems = userCount + eventCount + allianceCount;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      results: {
        users,
        events,
        alliances
      },
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalItems,
      totalPages
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Failed to perform search' });
  }
});

// Search users only
router.get('/search/users', async (req, res) => {
  try {
    const { q, page = 1, limit = 10, sort = 'relevance' } = req.query;
    const offset = (page - 1) * limit;
    const searchQuery = { [Op.iLike]: `%${q}%` };

    const [users, total] = await Promise.all([
      User.findAll({
        where: {
          [Op.or]: [
            { username: searchQuery },
            { '$profile.bio$': searchQuery }
          ]
        },
        include: [{
          model: UserProfile,
          as: 'profile'
        }],
        limit,
        offset,
        order: sort === 'date' ? [['createdAt', 'DESC']] :
               sort === 'name' ? [['username', 'ASC']] :
               [['username', 'ASC']]
      }),
      User.count({
        where: {
          [Op.or]: [
            { username: searchQuery },
            { '$profile.bio$': searchQuery }
          ]
        },
        include: [{
          model: UserProfile,
          as: 'profile'
        }]
      })
    ]);

    res.json({
      results: { users },
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// Search events only
router.get('/search/events', async (req, res) => {
  try {
    const { q, page = 1, limit = 10, sort = 'relevance' } = req.query;
    const offset = (page - 1) * limit;
    const searchQuery = { [Op.iLike]: `%${q}%` };

    const [events, total] = await Promise.all([
      Event.findAll({
        where: {
          [Op.or]: [
            { name: searchQuery },
            { description: searchQuery },
            { location: searchQuery }
          ]
        },
        limit,
        offset,
        order: sort === 'date' ? [['start_date', 'DESC']] :
               sort === 'name' ? [['name', 'ASC']] :
               [['createdAt', 'DESC']]
      }),
      Event.count({
        where: {
          [Op.or]: [
            { name: searchQuery },
            { description: searchQuery },
            { location: searchQuery }
          ]
        }
      })
    ]);

    res.json({
      results: { events },
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Event search error:', error);
    res.status(500).json({ message: 'Failed to search events' });
  }
});

// Search alliances only
router.get('/search/alliances', async (req, res) => {
  try {
    const { q, page = 1, limit = 10, sort = 'relevance' } = req.query;
    const offset = (page - 1) * limit;
    const searchQuery = { [Op.iLike]: `%${q}%` };

    const [alliances, total] = await Promise.all([
      Alliance.findAll({
        where: {
          [Op.or]: [
            { name: searchQuery },
            { description: searchQuery }
          ]
        },
        limit,
        offset,
        order: sort === 'date' ? [['createdAt', 'DESC']] :
               sort === 'name' ? [['name', 'ASC']] :
               [['name', 'ASC']]
      }),
      Alliance.count({
        where: {
          [Op.or]: [
            { name: searchQuery },
            { description: searchQuery }
          ]
        }
      })
    ]);

    res.json({
      results: { alliances },
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Alliance search error:', error);
    res.status(500).json({ message: 'Failed to search alliances' });
  }
});

module.exports = router;