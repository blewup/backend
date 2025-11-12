const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const db = require('../models');

router.post('/tickets', optionalAuth, async (req, res) => {
  try {
    const { email, subject, message, priority = 'normal' } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Email, subject, and message are required' });
    }

    const ticket = await db.SupportTicket.create({
      user_id: req.userId || null,
      email,
      subject,
      message,
      priority,
      status: 'open'
    });

    if (req.userId) {
      await db.UserActivity.logActivity(req.userId, {
        activity_type: 'support_ticket_created',
        activity_description: `Created support ticket: ${subject}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        related_entity_type: 'support_ticket',
        related_entity_id: ticket.id
      });
    }

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket_id: ticket.id,
      ticket
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereCondition = { user_id: req.userId };
    if (status) {
      whereCondition.status = status;
    }

    const tickets = await db.SupportTicket.findAll({
      where: whereCondition,
      include: [
        {
          model: db.User,
          as: 'assignedAdmin',
          attributes: ['id', 'username']
        },
        {
          model: db.SupportResponse,
          as: 'responses',
          include: [
            {
              model: db.User,
              as: 'responder',
              attributes: ['id', 'username']
            }
          ],
          order: [['created_at', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Get specific ticket
router.get('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await db.SupportTicket.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId
      },
      include: [
        {
          model: db.User,
          as: 'assignedAdmin',
          attributes: ['id', 'username']
        },
        {
          model: db.SupportResponse,
          as: 'responses',
          where: { is_internal_note: false }, // Only show non-internal responses to users
          include: [
            {
              model: db.User,
              as: 'responder',
              attributes: ['id', 'username']
            }
          ],
          order: [['created_at', 'ASC']],
          required: false
        },
        {
          model: db.SupportAttachment,
          as: 'attachments',
          attributes: ['id', 'filename', 'file_size', 'mime_type', 'uploaded_at']
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Add response to ticket
router.post('/tickets/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { response_text } = req.body;

    if (!response_text || response_text.trim() === '') {
      return res.status(400).json({ error: 'Response text is required' });
    }

    // Verify ticket ownership
    const ticket = await db.SupportTicket.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return res.status(400).json({ error: 'Cannot respond to closed ticket' });
    }

    const response = await db.SupportResponse.create({
      ticket_id: req.params.id,
      responder_id: req.userId,
      response_text: response_text.trim(),
      is_internal_note: false
    });

    // Update ticket status
    await ticket.update({
      status: 'waiting_response',
      updated_at: new Date()
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'support_ticket_updated',
      activity_description: 'Added response to support ticket',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'support_ticket',
      related_entity_id: ticket.id
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

// Close ticket
router.put('/tickets/:id/close', authenticateToken, async (req, res) => {
  try {
    const ticket = await db.SupportTicket.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await ticket.update({
      status: 'closed',
      updated_at: new Date()
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'support_ticket_updated',
      activity_description: 'Closed support ticket',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'support_ticket',
      related_entity_id: ticket.id
    });

    res.json({ message: 'Ticket closed successfully', ticket });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ error: 'Failed to close ticket' });
  }
});

// Admin routes (protected by admin middleware)
const { requireRole } = require('../middleware/auth');

// Get all tickets (admin only)
router.get('/admin/tickets', authenticateToken, requireRole('admin', 'super_admin', 'moderator'), async (req, res) => {
  try {
    const { status, priority, assigned_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (status) whereCondition.status = status;
    if (priority) whereCondition.priority = priority;
    if (assigned_to) whereCondition.assigned_to = assigned_to;

    const tickets = await db.SupportTicket.findAll({
      where: whereCondition,
      include: [
        {
          model: db.User,
          as: 'submitter',
          attributes: ['id', 'username', 'email']
        },
        {
          model: db.User,
          as: 'assignedAdmin',
          attributes: ['id', 'username']
        },
        {
          model: db.SupportResponse,
          as: 'responses',
          include: [
            {
              model: db.User,
              as: 'responder',
              attributes: ['id', 'username']
            }
          ],
          order: [['created_at', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Admin: Add internal note
router.post('/admin/tickets/:id/notes', authenticateToken, requireRole('admin', 'super_admin', 'moderator'), async (req, res) => {
  try {
    const { response_text } = req.body;

    const response = await db.SupportResponse.create({
      ticket_id: req.params.id,
      responder_id: req.userId,
      response_text,
      is_internal_note: true
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Add internal note error:', error);
    res.status(500).json({ error: 'Failed to add internal note' });
  }
});

router.put('/admin/tickets/:id/assign', authenticateToken, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { assigned_to } = req.body;

    const ticket = await db.SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await ticket.update({
      assigned_to,
      status: 'in_progress',
      updated_at: new Date()
    });

    res.json({ message: 'Ticket assigned successfully', ticket });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
});

router.put('/admin/tickets/:id/status', authenticateToken, requireRole('admin', 'super_admin', 'moderator'), async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await db.SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await ticket.update({
      status,
      updated_at: new Date(),
      ...(status === 'resolved' && { resolved_at: new Date() })
    });

    res.json({ message: 'Ticket status updated successfully', ticket });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

module.exports = router;