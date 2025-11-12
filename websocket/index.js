const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../models');

function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.username})`);
    
    // Join user's personal room
    socket.join(`user:${socket.user.id}`);
    
    // Join alliance room if user is in an alliance
    if (socket.user.alliance_id) {
      socket.join(`alliance:${socket.user.alliance_id}`);
    }

    // Broadcast online status to friends
    socket.broadcast.emit('user:online', {
      userId: socket.user.id,
      username: socket.user.username
    });

    // Handle direct messages
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content, conversationId } = data;
        
        // Create or get conversation
        let conversation;
        if (conversationId) {
          conversation = await db.Conversation.findByPk(conversationId);
        } else {
          // Check if conversation exists between users
          conversation = await db.Conversation.findOne({
            include: [{
              model: db.ConversationParticipant,
              as: 'participants',
              where: {
                user_id: [socket.user.id, receiverId]
              }
            }],
            where: {
              type: 'direct'
            }
          });
          
          if (!conversation) {
            // Create new conversation
            conversation = await db.Conversation.create({
              type: 'direct',
              created_by: socket.user.id
            });
            
            // Add participants
            await db.ConversationParticipant.bulkCreate([
              { conversation_id: conversation.id, user_id: socket.user.id },
              { conversation_id: conversation.id, user_id: receiverId }
            ]);
          }
        }
        
        // Create message
        const message = await db.ConversationMessage.create({
          conversation_id: conversation.id,
          sender_id: socket.user.id,
          receiver_id: receiverId,
          content,
          message_type: 'text',
          is_read: false
        });
        
        const messageData = {
          id: message.id,
          conversationId: conversation.id,
          senderId: socket.user.id,
          senderUsername: socket.user.username,
          receiverId,
          content,
          timestamp: message.created_at
        };
        
        // Send to receiver
        io.to(`user:${receiverId}`).emit('message:received', messageData);
        
        // Confirm to sender
        socket.emit('message:sent', messageData);
        
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('message:read', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await db.ConversationMessage.findByPk(messageId);
        if (message && message.receiver_id === socket.user.id) {
          await message.update({ is_read: true, read_at: new Date() });
          
          // Notify sender
          io.to(`user:${message.sender_id}`).emit('message:read', {
            messageId,
            readBy: socket.user.id,
            readAt: message.read_at
          });
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      const { receiverId } = data;
      io.to(`user:${receiverId}`).emit('typing:indicator', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      const { receiverId } = data;
      io.to(`user:${receiverId}`).emit('typing:indicator', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping: false
      });
    });

    // Handle friend requests
    socket.on('friend:request', async (data) => {
      try {
        const { receiverId } = data;
        
        // Check if request already exists
        const existing = await db.FriendRequest.findOne({
          where: {
            sender_id: socket.user.id,
            receiver_id: receiverId,
            status: 'pending'
          }
        });
        
        if (existing) {
          socket.emit('error', { message: 'Friend request already sent' });
          return;
        }
        
        // Create friend request
        const request = await db.FriendRequest.create({
          sender_id: socket.user.id,
          receiver_id: receiverId,
          status: 'pending'
        });
        
        // Notify receiver
        io.to(`user:${receiverId}`).emit('friend:request:received', {
          id: request.id,
          senderId: socket.user.id,
          senderUsername: socket.user.username,
          senderProfilePicture: socket.user.profile_picture,
          timestamp: request.created_at
        });
        
        // Confirm to sender
        socket.emit('friend:request:sent', {
          id: request.id,
          receiverId
        });
        
      } catch (error) {
        console.error('Friend request error:', error);
        socket.emit('error', { message: 'Failed to send friend request' });
      }
    });

    // Handle friend request acceptance
    socket.on('friend:accept', async (data) => {
      try {
        const { requestId } = data;
        
        const request = await db.FriendRequest.findByPk(requestId);
        if (!request || request.receiver_id !== socket.user.id) {
          socket.emit('error', { message: 'Friend request not found' });
          return;
        }
        
        await request.update({ status: 'accepted' });
        
        // Notify sender
        io.to(`user:${request.sender_id}`).emit('friend:accepted', {
          requestId,
          acceptedBy: socket.user.id,
          username: socket.user.username
        });
        
        // Confirm to receiver
        socket.emit('friend:request:accepted', {
          requestId,
          friendId: request.sender_id
        });
        
      } catch (error) {
        console.error('Friend accept error:', error);
        socket.emit('error', { message: 'Failed to accept friend request' });
      }
    });

    // Handle friend request rejection
    socket.on('friend:reject', async (data) => {
      try {
        const { requestId } = data;
        
        const request = await db.FriendRequest.findByPk(requestId);
        if (!request || request.receiver_id !== socket.user.id) {
          socket.emit('error', { message: 'Friend request not found' });
          return;
        }
        
        await request.update({ status: 'rejected' });
        
        socket.emit('friend:request:rejected', { requestId });
        
      } catch (error) {
        console.error('Friend reject error:', error);
        socket.emit('error', { message: 'Failed to reject friend request' });
      }
    });

    // Handle alliance events
    socket.on('alliance:action', async (data) => {
      try {
        // Verify user has permission for this action
        const member = await db.AllianceMember.findOne({
          where: {
            user_id: socket.user.id,
            alliance_id: data.alliance_id
          }
        });

        if (!member) {
          socket.emit('error', { message: 'Not a member of this alliance' });
          return;
        }

        // Broadcast action to alliance members
        io.to(`alliance:${data.alliance_id}`).emit('alliance:update', {
          type: data.type,
          payload: data.payload,
          userId: socket.user.id
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle NPC interactions
    socket.on('npc:interact', async (data) => {
      try {
        const npc = await db.NPC.findByPk(data.npcId);
        if (!npc) {
          socket.emit('error', { message: 'NPC not found' });
          return;
        }

        // Check if interaction is allowed
        const canInteract = await npc.canInteract(socket.user.id);
        if (!canInteract) {
          socket.emit('error', { message: 'Interaction cooldown in effect' });
          return;
        }

        // Record interaction
        await npc.recordInteraction(socket.user.id, data.type, data.data);

        // Notify user of interaction result
        socket.emit('npc:response', {
          type: data.type,
          npcId: npc.id,
          dialogue: npc.getDialogue(data.type)
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle territory updates
    socket.on('territory:update', async (data) => {
      try {
        // Verify user has permission to update territory
        const alliance = await db.Alliance.findByPk(data.alliance_id);
        if (!alliance || alliance.leader_id !== socket.user.id) {
          socket.emit('error', { message: 'Unauthorized territory update' });
          return;
        }

        // Broadcast territory update to alliance members
        io.to(`alliance:${data.alliance_id}`).emit('territory:updated', {
          territory: data.territory,
          updatedBy: socket.user.id
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle resource updates
    socket.on('resource:update', async (data) => {
      try {
        const member = await db.AllianceMember.findOne({
          where: {
            user_id: socket.user.id,
            alliance_id: data.alliance_id
          }
        });

        if (!member || !member.can_manage_resources) {
          socket.emit('error', { message: 'Unauthorized resource management' });
          return;
        }

        // Broadcast resource update to alliance members
        io.to(`alliance:${data.alliance_id}`).emit('resource:updated', {
          resources: data.resources,
          updatedBy: socket.user.id
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
      
      // Broadcast offline status to friends
      socket.broadcast.emit('user:offline', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });
  });

  return io;
}

module.exports = setupWebSocket;