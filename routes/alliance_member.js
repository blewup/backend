const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../models');
const { Op } = require('sequelize');

// Apply to join alliance
router.post('/:allianceId/apply', authenticateToken, async (req, res) => {
  try {
    const { application_message } = req.body;
    const alliance = await db.Alliance.findByPk(req.params.allianceId);

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    if (alliance.status !== 'active') {
      return res.status(400).json({ error: 'Alliance is not active' });
    }

    if (!alliance.is_recruiting) {
      return res.status(400).json({ error: 'Alliance is not currently recruiting' });
    }

    // Check if user is already a member
    const existingMember = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: req.userId,
        status: { [Op.in]: ['active', 'recruit'] }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this alliance' });
    }

    let memberStatus = 'active';
    let role = 'member';

    // Handle different membership types
    switch (alliance.membership_type) {
      case 'open':
        memberStatus = 'active';
        role = 'member';
        break;
      case 'approval':
        memberStatus = 'recruit';
        role = 'recruit';
        break;
      case 'invite_only':
        return res.status(400).json({ error: 'This alliance requires an invitation to join' });
      case 'closed':
        return res.status(400).json({ error: 'This alliance is closed to new members' });
    }

    const member = await db.AllianceMember.create({
      alliance_id: alliance.id,
      user_id: req.userId,
      role,
      status: memberStatus,
      application_message,
      joined_at: new Date()
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'event_registration',
      activity_description: `Applied to join alliance: ${alliance.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'alliance',
      related_entity_id: alliance.id
    });

    res.status(201).json({
      message: alliance.membership_type === 'open' 
        ? 'Successfully joined alliance' 
        : 'Application submitted for review',
      member
    });
  } catch (error) {
    console.error('Apply to alliance error:', error);
    res.status(500).json({ error: 'Failed to apply to alliance' });
  }
});

// Invite user to alliance
router.post('/:allianceId/invite', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const alliance = await db.Alliance.findByPk(req.params.allianceId);

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    // Check if user can invite
    const inviterMember = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: req.userId,
        status: 'active'
      }
    });

    if (!inviterMember || !inviterMember.canInvite()) {
      return res.status(403).json({ error: 'Insufficient permissions to invite members' });
    }

    // Check if alliance is full
    if (await alliance.isFull()) {
      return res.status(400).json({ error: 'Alliance has reached maximum member capacity' });
    }

    // Find user to invite
    const userToInvite = await db.User.findOne({
      where: { username, is_active: true }
    });

    if (!userToInvite) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: userToInvite.id,
        status: { [Op.in]: ['active', 'recruit'] }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this alliance' });
    }

    const member = await db.AllianceMember.create({
      alliance_id: alliance.id,
      user_id: userToInvite.id,
      role: 'recruit',
      status: 'recruit',
      invited_by: req.userId,
      joined_at: new Date()
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'friend_request_sent',
      activity_description: `Invited ${username} to alliance: ${alliance.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: userToInvite.id,
      related_entity_type: 'alliance',
      related_entity_id: alliance.id
    });

    res.status(201).json({
      message: 'User invited to alliance',
      member
    });
  } catch (error) {
    console.error('Invite to alliance error:', error);
    res.status(500).json({ error: 'Failed to invite user to alliance' });
  }
});

// Get alliance members
router.get('/:allianceId/members', async (req, res) => {
  try {
    const { role, status = 'active', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const alliance = await db.Alliance.findByPk(req.params.allianceId);
    
    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    if (!alliance.is_public && (!req.userId || !await alliance.isMember(req.userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const whereCondition = { alliance_id: alliance.id };
    if (role) whereCondition.role = role;
    if (status) whereCondition.status = status;

    const { count, rows: members } = await db.AllianceMember.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'preferred_gameplay_type', 'last_login', 'created_at']
        }
      ],
      order: [
        ['role', 'ASC'],
        ['joined_at', 'ASC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get alliance members error:', error);
    res.status(500).json({ error: 'Failed to fetch alliance members' });
  }
});

// Update member role (promote/demote)
router.put('/:allianceId/members/:userId/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const alliance = await db.Alliance.findByPk(req.params.allianceId);

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    // Check if requester can manage roles
    const requesterMember = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: req.userId,
        status: 'active'
      }
    });

    if (!requesterMember || !requesterMember.canManageRoles()) {
      return res.status(403).json({ error: 'Insufficient permissions to manage roles' });
    }

    // Cannot change leader role
    if (role === 'leader') {
      return res.status(400).json({ error: 'Cannot assign leader role through this endpoint' });
    }

    const memberToUpdate = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: req.params.userId,
        status: 'active'
      }
    });

    if (!memberToUpdate) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cannot change own role if you're not leader
    if (memberToUpdate.user_id === req.userId && requesterMember.role !== 'leader') {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    await db.AllianceMember.promoteMember(alliance.id, req.params.userId, role);

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'settings_updated',
      activity_description: `Changed ${memberToUpdate.user.username}'s role to ${role} in alliance: ${alliance.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: memberToUpdate.user_id,
      related_entity_type: 'alliance',
      related_entity_id: alliance.id
    });

    res.json({ message: `Member role updated to ${role}` });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Leave alliance
router.delete('/:allianceId/leave', authenticateToken, async (req, res) => {
  try {
    const alliance = await db.Alliance.findByPk(req.params.allianceId);

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    const member = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: req.userId,
        status: 'active'
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'You are not a member of this alliance' });
    }

    // Leader cannot leave - must disband or transfer leadership first
    if (member.role === 'leader') {
      return res.status(400).json({ 
        error: 'Leader cannot leave alliance. Transfer leadership or disband the alliance first.' 
      });
    }

    await member.update({
      status: 'left',
      left_at: new Date(),
      leave_reason: 'Voluntarily left'
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'subscription_cancelled',
      activity_description: `Left alliance: ${alliance.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_entity_type: 'alliance',
      related_entity_id: alliance.id
    });

    res.json({ message: 'Successfully left the alliance' });
  } catch (error) {
    console.error('Leave alliance error:', error);
    res.status(500).json({ error: 'Failed to leave alliance' });
  }
});

// Kick member from alliance
router.delete('/:allianceId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { kick_reason } = req.body;
    const alliance = await db.Alliance.findByPk(req.params.allianceId);

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    // Check if requester can kick members
    const requesterMember = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: req.userId,
        status: 'active',
        role: { [Op.in]: ['leader', 'admin', 'officer'] }
      }
    });

    if (!requesterMember) {
      return res.status(403).json({ error: 'Insufficient permissions to kick members' });
    }

    const memberToKick = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: req.params.userId,
        status: 'active'
      },
      include: [{ model: db.User, as: 'user' }]
    });

    if (!memberToKick) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cannot kick yourself
    if (memberToKick.user_id === req.userId) {
      return res.status(400).json({ error: 'Cannot kick yourself' });
    }

    // Check role hierarchy
    const roleHierarchy = { leader: 4, admin: 3, officer: 2, treasurer: 2, member: 1, recruit: 0 };
    if (roleHierarchy[memberToKick.role] >= roleHierarchy[requesterMember.role]) {
      return res.status(403).json({ error: 'Cannot kick members with equal or higher role' });
    }

    await memberToKick.update({
      status: 'kicked',
      left_at: new Date(),
      kick_reason,
      kicked_by: req.userId
    });

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'security_alert',
      activity_description: `Kicked ${memberToKick.user.username} from alliance: ${alliance.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: memberToKick.user_id,
      related_entity_type: 'alliance',
      related_entity_id: alliance.id
    });

    res.json({ message: 'Member kicked from alliance' });
  } catch (error) {
    console.error('Kick member error:', error);
    res.status(500).json({ error: 'Failed to kick member' });
  }
});

// Transfer leadership
router.post('/:allianceId/transfer-leadership', authenticateToken, async (req, res) => {
  try {
    const { new_leader_id } = req.body;
    const alliance = await db.Alliance.findByPk(req.params.allianceId);

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    // Only current leader can transfer leadership
    if (alliance.leader_id !== req.userId) {
      return res.status(403).json({ error: 'Only alliance leader can transfer leadership' });
    }

    const newLeaderMember = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: new_leader_id,
        status: 'active'
      }
    });

    if (!newLeaderMember) {
      return res.status(404).json({ error: 'New leader is not a member of this alliance' });
    }

    // Update alliance leader
    await alliance.update({ leader_id: new_leader_id });

    // Update member roles
    await db.AllianceMember.update(
      { role: 'admin' },
      { where: { alliance_id: alliance.id, user_id: req.userId } }
    );

    await db.AllianceMember.update(
      { role: 'leader', promoted_at: new Date() },
      { where: { alliance_id: alliance.id, user_id: new_leader_id } }
    );

    // Log activity
    await db.UserActivity.logActivity(req.userId, {
      activity_type: 'settings_updated',
      activity_description: `Transferred leadership of ${alliance.name} to another member`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      related_user_id: new_leader_id,
      related_entity_type: 'alliance',
      related_entity_id: alliance.id
    });

    res.json({ message: 'Leadership transferred successfully' });
  } catch (error) {
    console.error('Transfer leadership error:', error);
    res.status(500).json({ error: 'Failed to transfer leadership' });
  }
});

// Get user's alliance memberships
router.get('/user/memberships', authenticateToken, async (req, res) => {
  try {
    const memberships = await db.AllianceMember.findAll({
      where: {
        user_id: req.userId,
        status: 'active'
      },
      include: [
        {
          model: db.Alliance,
          as: 'alliance',
          include: [
            {
              model: db.User,
              as: 'leader',
              attributes: ['id', 'username']
            }
          ]
        }
      ],
      order: [['joined_at', 'DESC']]
    });

    res.json(memberships);
  } catch (error) {
    console.error('Get user memberships error:', error);
    res.status(500).json({ error: 'Failed to fetch memberships' });
  }
});

// Update member activity
router.put('/:allianceId/activity', authenticateToken, async (req, res) => {
  try {
    const { activity_score } = req.body;
    const alliance = await db.Alliance.findByPk(req.params.allianceId);

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    const member = await db.AllianceMember.findOne({
      where: {
        alliance_id: alliance.id,
        user_id: req.userId,
        status: 'active'
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'You are not a member of this alliance' });
    }

    await member.update({
      activity_score: Math.min(100, Math.max(0, activity_score)),
      last_activity: new Date()
    });

    // Update alliance XP based on activity
    const xpGain = Math.floor(activity_score / 10);
    if (xpGain > 0) {
      await alliance.increment('total_xp', { by: xpGain });
      await member.increment('xp_earned', { by: xpGain });
    }

    res.json({ message: 'Activity updated successfully', member });
  } catch (error) {
    console.error('Update member activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

module.exports = router;