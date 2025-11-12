const express = require('express');
const router = express.Router();
const { Event, EventsParticipant: EventParticipant, User } = require('../models');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { eventValidation } = require('../schemas/validationSchemas');
const validate = require('../middleware/validate');
const { Op } = require('sequelize');

// Get events calendar for 2 years (4 columns x 6 rows = 24 months)
router.get('/calendar', async (req, res) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2);

    // Generate or fetch events for the period
    await Event.generateHolidayEvents(startDate, endDate);

    // Get all events for the period
    const events = await Event.findAll({
      where: {
        event_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['event_date', 'ASC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }]
    });

    // Organize events by month for the calendar
    const calendarData = organizeEventsIntoCalendar(events, startDate, endDate);

    res.json({
      success: true,
      data: {
        calendar: calendarData,
        total_events: events.length,
        timeframe: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar data'
    });
  }
});

// Get upcoming events (next 3 months)
router.get('/upcoming', async (req, res) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    const events = await Event.findAll({
      where: {
        event_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['event_date', 'ASC'], ['event_time', 'ASC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }, {
        model: EventParticipant,
        as: 'participants',
        attributes: ['id']
      }]
    });

    res.json({
      success: true,
      data: events.map(event => ({
        ...event.toJSON(),
        participant_count: event.participants.length,
        status: event.getStatus(),
        formatted_date: event.getFormattedDate()
      }))
    });
  } catch (error) {
    console.error('Upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming events'
    });
  }
});

// Get featured events
router.get('/featured', async (req, res) => {
  try {
    const events = await Event.findAll({
      where: {
        is_featured: true,
        event_date: {
          [Op.gte]: new Date()
        }
      },
      order: [['event_date', 'ASC']],
      limit: 6
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Featured events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured events'
    });
  }
});

// Get events by type
router.get('/type/:eventType', async (req, res) => {
  try {
    const { eventType } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: events } = await Event.findAndCountAll({
      where: {
        event_type: eventType,
        event_date: {
          [Op.gte]: new Date()
        }
      },
      order: [['event_date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        events,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Events by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events by type'
    });
  }
});

// Register for event
router.post('/:eventId/register', authenticateToken, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('Event not found');
      error.status = 404;
      throw error;
    }

    if (event.getStatus() !== 'upcoming') {
      const error = new Error('Cannot register for past or ongoing events');
      error.status = 400;
      throw error;
    }

    if (event.registration_required && event.current_participants >= event.max_participants) {
      const error = new Error('Event is full');
      error.status = 400;
      throw error;
    }

    // Check if already registered
    const existingRegistration = await EventParticipant.findOne({
      where: {
        event_id: eventId,
        user_id: userId
      }
    });

    if (existingRegistration) {
      const error = new Error('Already registered for this event');
      error.status = 400;
      throw error;
    }

    // Create registration
    await EventParticipant.create({
      event_id: eventId,
      user_id: userId,
      registration_date: new Date()
    });

    // Update participant count
    await event.increment('current_participants');

    res.json({
      success: true,
      message: 'Successfully registered for event'
    });
  } catch (error) {
    next(error);
  }
});

// Create new event (Admin only)
router.post('/', [authenticateToken, validate(eventValidation.create)], async (req, res, next) => {
  try {
    const {
      event_type,
      title,
      description,
      event_date,
      event_time,
      end_date,
      is_featured,
      is_main_event,
      registration_required,
      max_participants,
      prize_pool,
      color,
      image_url
    } = req.body;

    const event = await Event.create({
      event_type,
      title,
      description,
      event_date,
      event_time,
      end_date,
      is_featured: is_featured || false,
      is_main_event: is_main_event || false,
      registration_required: registration_required || false,
      max_participants,
      prize_pool,
      color: color || '#4CAF50',
      image_url,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to organize events into calendar format
function organizeEventsIntoCalendar(events, startDate, endDate) {
  const calendar = [];
  const current = new Date(startDate);
  current.setDate(1); // Start from first day of month

  while (current <= endDate) {
    const year = current.getFullYear();
    const month = current.getMonth();
    
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });

    calendar.push({
      year,
      month: month + 1,
      monthName: current.toLocaleDateString('en-US', { month: 'long' }),
      events: monthEvents.map(event => ({
        id: event.id,
        title: event.title,
        type: event.event_type,
        date: event.event_date,
        color: event.color,
        is_featured: event.is_featured,
        prize_pool: event.prize_pool
      }))
    });

    current.setMonth(current.getMonth() + 1);
  }

  // Split into 4 columns of 6 months each (2 years total)
  const columns = [];
  for (let i = 0; i < 4; i++) {
    columns.push(calendar.slice(i * 6, (i + 1) * 6));
  }

  return columns;
}

module.exports = router;