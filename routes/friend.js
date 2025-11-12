const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../models');

// Send friend request
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const { receiver_username } = req.body;

    if (!receiver_username) {
      return res.status(400).json({ error: 'Receiver username is required' });
    }

    // Find receiver user
    const receiver = await db.User.findOne({
      where: { username: receiver_username, is_active: true }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (receiver.id === req.userId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friend request already exists
    const existingRequest = await db.FriendRequest.findOne({
      where: {
        sender_id: req.userId,
        receiver_id: receiver.id
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Create friend request
    const friendRequest = await db.FriendRequest.create({
      sender_id: req.userId,
      receiver_id: receiver.id,
      status: 'pending'
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'friend_request_sent',
      activity_description: `Sent friend request to ${receiver.username}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: receiver.id
    });

    res.status(201).json({
      message: 'Friend request sent successfully',
      friend_request: friendRequest
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Get friend requests (sent and received)
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { type = 'received' } = req.query; // 'sent' or 'received'

    let whereCondition = {};
    let includeUser = '';

    if (type === 'sent') {
      whereCondition.sender_id = req.userId;
      includeUser = 'receiver';
    } else {
      whereCondition.receiver_id = req.userId;
      includeUser = 'sender';
    }

    const friendRequests = await db.FriendRequest.findAll({
      where: whereCondition,
      include: [
        {
          model: db.User,
          as: includeUser,
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(friendRequests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Accept friend request
router.put('/requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    const friendRequest = await db.FriendRequest.findOne({
      where: {
        id: req.params.id,
        receiver_id: req.userId,
        status: 'pending'
      },
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await friendRequest.update({ status: 'accepted' });

    // Log activities for both users
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'friend_request_accepted',
      activity_description: `Accepted friend request from ${friendRequest.sender.username}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: friendRequest.sender_id
    });

    await db.UserActivity.logActivity(friendRequest.sender_id, {
      activity_type: 'friend_request_accepted',
      activity_description: `Friend request accepted by ${req.user.username}`,
      related_user_id: req.userId
    });

    res.json({ message: 'Friend request accepted', friend_request: friendRequest });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Reject friend request
router.put('/requests/:id/reject', authenticateToken, async (req, res) => {
  try {
    const friendRequest = await db.FriendRequest.findOne({
      where: {
        id: req.params.id,
        receiver_id: req.userId,
        status: 'pending'
      },
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await friendRequest.update({ status: 'rejected' });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'friend_request_declined',
      activity_description: `Declined friend request from ${friendRequest.sender.username}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: friendRequest.sender_id
    });

    res.json({ message: 'Friend request rejected', friend_request: friendRequest });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Cancel friend request
router.delete('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const friendRequest = await db.FriendRequest.findOne({
      where: {
        id: req.params.id,
        sender_id: req.userId,
        status: 'pending'
      }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await friendRequest.destroy();

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'friend_request_sent',
      activity_description: 'Cancelled friend request',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: friendRequest.receiver_id
    });

    res.json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ error: 'Failed to cancel friend request' });
  }
});

// Get friends list
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const friends = await db.FriendRequest.findAll({
      where: {
        status: 'accepted',
        $or: [
          { sender_id: req.userId },
          { receiver_id: req.userId }
        ]
      },
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username', 'email', 'biography', 'preferred_gameplay_type', 'last_login']
        },
        {
          model: db.User,
          as: 'receiver',
          attributes: ['id', 'username', 'email', 'biography', 'preferred_gameplay_type', 'last_login']
        }
      ]
    });

    // Transform response to show friend user details
    const friendsList = friends.map(request => {
      const friend = request.sender_id === req.userId ? request.receiver : request.sender;
      return {
        friendship_id: request.id,
        friend_since: request.updated_at,
        friend: friend
      };
    });

    res.json(friendsList);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Remove friend
router.delete('/friends/:friendId', authenticateToken, async (req, res) => {
  try {
    const friendRequest = await db.FriendRequest.findOne({
      where: {
        status: 'accepted',
        $or: [
          { sender_id: req.userId, receiver_id: req.params.friendId },
          { sender_id: req.params.friendId, receiver_id: req.userId }
        ]
      }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    await friendRequest.destroy();

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'friend_request_declined',
      activity_description: 'Removed friend',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: req.params.friendId
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

module.exports = router;