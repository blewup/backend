const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/admin');
const { User, Alliance, Event } = require('../models');

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.update({
      is_deleted: true,
      deleted_at: new Date(),
      deletion_reason: 'Deleted by admin'
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alliance
router.delete('/alliances/:id', isAdmin, async (req, res) => {
  try {
    const alliance = await Alliance.findByPk(req.params.id);
    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }
    await alliance.destroy();
    res.json({ message: 'Alliance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/events', isAdmin, async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      created_by: req.user.id
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/events/:id', isAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    await event.destroy();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;