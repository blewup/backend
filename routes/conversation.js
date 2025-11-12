const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../models');
const { Op } = require('sequelize');

// Get all conversations for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const conversations = await db.ConversationParticipant.findAll({
      where: {
        user_id: req.userId,
        is_active: true
      },
      include: [
        {
          model: db.Conversation,
          as: 'conversation',
          include: [
            {
              model: db.ConversationMessage,
              as: 'lastMessage',
              attributes: ['message_text', 'created_at'],
              include: [
                {
                  model: db.User,
                  as: 'sender',
                  attributes: ['username']
                }
              ]
            },
            {
              model: db.ConversationParticipant,
              as: 'participants',
              where: {
                user_id: { [Op.ne]: req.userId },
                is_active: true
              },
              include: [
                {
                  model: db.User,
                  as: 'user',
                  attributes: ['id', 'username']
                }
              ],
              required: false
            }
          ]
        }
      ],
      order: [[{ model: db.Conversation, as: 'conversation' }, 'last_message_at', 'DESC']]
    });

    res.json(conversations.map(participant => participant.conversation));
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create direct conversation
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { participant_username } = req.body;

    if (!participant_username) {
      return res.status(400).json({ error: 'Participant username is required' });
    }

    // Find participant user
    const participant = await db.User.findOne({
      where: { username: participant_username, is_active: true }
    });

    if (!participant) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (participant.id === req.userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    const existingConversation = await db.Conversation.findOne({
      where: {
        conversation_type: 'direct'
      },
      include: [
        {
          model: db.ConversationParticipant,
          as: 'participants',
          where: {
            user_id: [req.userId, participant.id],
            is_active: true
          }
        }
      ]
    });

    if (existingConversation) {
      return res.status(400).json({ 
        error: 'Conversation already exists',
        conversation: existingConversation 
      });
    }

    // Create new conversation
    const conversation = await db.Conversation.create({
      conversation_type: 'direct'
    });

    // Add participants
    await db.ConversationParticipant.bulkCreate([
      {
        conversation_id: conversation.id,
        user_id: req.userId,
        is_active: true,
        joined_at: new Date()
      },
      {
        conversation_id: conversation.id,
        user_id: participant.id,
        is_active: true,
        joined_at: new Date()
      }
    ]);

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'message_sent',
      activity_description: `Started conversation with ${participant.username}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: participant.id,
      related_entity_type: 'conversation',
      related_entity_id: conversation.id
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get conversation messages
router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is participant
    const participant = await db.ConversationParticipant.findOne({
      where: {
        conversation_id: req.params.id,
        user_id: req.userId,
        is_active: true
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await db.ConversationMessage.findAll({
      where: { conversation_id: req.params.id },
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Mark messages as read
    await db.ConversationMessage.update(
      { is_read: true },
      {
        where: {
          conversation_id: req.params.id,
          sender_id: { [Op.ne]: req.userId },
          is_read: false
        }
      }
    );

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { message_text } = req.body;

    if (!message_text || message_text.trim() === '') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Check if user is participant
    const participant = await db.ConversationParticipant.findOne({
      where: {
        conversation_id: req.params.id,
        user_id: req.userId,
        is_active: true
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = await db.ConversationMessage.create({
      conversation_id: req.params.id,
      sender_id: req.userId,
      message_text: message_text.trim()
    });

    // Update conversation last message
    await db.Conversation.update(
      {
        last_message_id: message.id,
        last_message_at: new Date()
      },
      { where: { id: req.params.id } }
    );

    // Include sender info in response
    const messageWithSender = await db.ConversationMessage.findByPk(message.id, {
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username']
        }
      ]
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'message_sent',
      activity_description: 'Sent message in conversation',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'conversation',
      related_entity_id: req.params.id
    });

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Leave conversation
router.put('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const participant = await db.ConversationParticipant.findOne({
      where: {
        conversation_id: req.params.id,
        user_id: req.userId,
        is_active: true
      },
      include: [
        {
          model: db.Conversation,
          as: 'conversation'
        }
      ]
    });

    if (!participant) {
      return res.status(404).json({ error: 'Not a participant in this conversation' });
    }

    await participant.update({
      is_active: false,
      left_at: new Date()
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'message_sent',
      activity_description: 'Left conversation',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'conversation',
      related_entity_id: req.params.id
    });

    res.json({ message: 'Left conversation successfully' });
  } catch (error) {
    console.error('Leave conversation error:', error);
    res.status(500).json({ error: 'Failed to leave conversation' });
  }
});

module.exports = router;