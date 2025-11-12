const { getPasswordHash, verifyPassword, createAccessToken } = require('../utils/auth');
const db = require('../models');

class UserService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, username, password, first_name, last_name } = userData;

    // Check if user already exists
    const existingUser = await db.User.findOne({
      where: {
        $or: [{ email }, { username }]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const password_hash = await getPasswordHash(password);

    // Create user
    const user = await db.User.create({
      email,
      username,
      password_hash,
      first_name,
      last_name,
      user_type: 'user',
      is_active: true
    });

    // Create access token
    const token = createAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.user_type
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type
      },
      token
    };
  }

  /**
   * Login user
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await db.User.findOne({
      where: { email, is_active: true, is_deleted: false }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Create access token
    const token = createAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.user_type
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        last_login: user.last_login
      },
      token
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await db.User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Remove password from update data (use changePassword for that)
    const { password, ...safeUpdateData } = updateData;
    
    await user.update(safeUpdateData);
    
    return await this.getProfile(userId);
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await getPasswordHash(newPassword);
    await user.update({ password_hash: newPasswordHash });

    return { message: 'Password updated successfully' };
  }
}

module.exports = new UserService();