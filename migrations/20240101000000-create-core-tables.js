'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // We create tables in an order that respects foreign key constraints.

    const addIndexSafely = async (tableName, fields, options = {}) => {
      const indexName = options.name || `${tableName}_${fields.join('_')}`;
      try {
        await queryInterface.addIndex(tableName, fields, { ...options, name: indexName });
      } catch (error) {
        const duplicateKey = error?.original?.code === 'ER_DUP_KEYNAME' || error?.original?.errno === 1061;
        if (!duplicateKey) {
          throw error;
        }
      }
    };

    const addConstraintSafely = async (tableName, options) => {
      try {
        await queryInterface.addConstraint(tableName, options);
      } catch (error) {
        const duplicateKey = error?.original?.code === 'ER_DUP_KEYNAME' || error?.original?.errno === 1061;
        if (!duplicateKey) {
          throw error;
        }
      }
    };
    
    // 1. users table (unchanged)
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      recovery_email_1: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      recovery_email_2: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      biography: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      preferred_gameplay_type: {
        type: Sequelize.ENUM('casual', 'competitive', 'roleplay', 'builder', 'explorer', 'social', 'hardcore', 'speedrun'),
        defaultValue: 'casual',
      },
      profile_picture: {
        type: Sequelize.BLOB('long'),
        allowNull: true,
      },
      profile_picture_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      cover_photo: {
        type: Sequelize.BLOB('long'),
        allowNull: true,
      },
      cover_photo_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      user_type: {
        type: Sequelize.ENUM('user', 'admin', 'super_admin', 'moderator'),
        allowNull: false,
        defaultValue: 'user',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      profile_cleared: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      profile_cleared_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      profile_clear_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deletion_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 2. user_locations table (unchanged)
    await queryInterface.createTable('user_locations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      address_type: {
        type: Sequelize.ENUM('home', 'work', 'billing', 'shipping', 'other'),
        allowNull: false,
        defaultValue: 'home',
      },
      street_address: { type: Sequelize.STRING(255), allowNull: true },
      street_address_2: { type: Sequelize.STRING(255), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      state_province: { type: Sequelize.STRING(100), allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true },
      country_code: { type: Sequelize.CHAR(2), allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10, 8), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(11, 8), allowNull: true },
      timezone: { type: Sequelize.STRING(50), allowNull: true },
      is_primary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), onUpdate: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // 3. user_social_profiles (unchanged)
    await queryInterface.createTable('user_social_profiles', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        platform: { type: Sequelize.ENUM('facebook', 'twitter', 'instagram', 'youtube', 'twitch', 'discord', 'reddit', 'linkedin', 'github', 'tiktok', 'snapchat', 'pinterest', 'telegram', 'whatsapp', 'other'), allowNull: false },
        profile_url: { type: Sequelize.STRING(500), allowNull: false },
        username: { type: Sequelize.STRING(100), allowNull: true },
        is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), onUpdate: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // 4. ENHANCED user_payment_methods table
    await queryInterface.createTable('user_payment_methods', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      method_type: {
        type: Sequelize.ENUM('credit_card', 'debit_card', 'paypal', 'crypto', 'bank_transfer', 'wallet'),
        allowNull: false,
        comment: 'Type of payment method',
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Payment provider (Stripe, PayPal, etc.)',
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this is the default payment method',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this payment method is active',
      },
      
      // Credit/Debit Card Fields
      card_last_four: {
        type: Sequelize.STRING(4),
        allowNull: true,
        comment: 'Last 4 digits of card',
      },
      card_brand: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Visa, MasterCard, Amex, etc.',
      },
      card_exp_month: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 12 },
      },
      card_exp_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      
      // PayPal Fields
      paypal_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: { isEmail: true },
      },
      
      // Crypto Fields
      crypto_wallet_address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      crypto_currency: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'BTC, ETH, USDT, etc.',
      },
      
      // Bank Transfer Fields
      bank_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      bank_account_last_four: {
        type: Sequelize.STRING(4),
        allowNull: true,
      },
      bank_routing_number: {
        type: Sequelize.STRING(9),
        allowNull: true,
      },
      
      // Provider-specific identifiers
      provider_customer_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Customer ID from payment provider',
      },
      provider_payment_method_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Payment method ID from provider',
      },
      
      // Security
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether payment method has been verified',
      },
      verification_token: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Token for payment method verification',
      },
      
      // Billing address reference
      billing_address_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'user_locations', key: 'id' },
        onDelete: 'SET NULL',
      },
      
      // Metadata
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional provider-specific data',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('user_profiles', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        user_id: { type: Sequelize.INTEGER, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        display_name: { type: Sequelize.STRING(100), allowNull: true },
        website: { type: Sequelize.STRING(255), allowNull: true },
        privacy_settings: { type: Sequelize.JSON, allowNull: true },
        notification_settings: { type: Sequelize.JSON, allowNull: true },
        game_stats: { type: Sequelize.JSON, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), onUpdate: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('user_activities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      activity_type: {
        type: Sequelize.ENUM(
          'login',
          'logout',
          'profile_view',
          'profile_update',
          'password_change',
          'email_change',
          'payment_method_added',
          'payment_method_removed',
          'transaction_completed',
          'event_registration',
          'event_cancellation',
          'friend_request_sent',
          'friend_request_accepted',
          'friend_request_declined',
          'message_sent',
          'support_ticket_created',
          'support_ticket_updated',
          'game_session_started',
          'game_session_ended',
          'achievement_unlocked',
          'level_up',
          'item_purchased',
          'subscription_started',
          'subscription_cancelled',
          'content_created',
          'content_shared',
          'content_liked',
          'content_commented',
          'search_performed',
          'settings_updated',
          'security_alert',
          'system_notification'
        ),
        allowNull: false,
        comment: 'Type of user activity',
      },
      activity_description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human-readable description of the activity',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IPv4 or IPv6 address',
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Browser/device user agent string',
      },
      device_type: {
        type: Sequelize.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
        allowNull: false,
        defaultValue: 'unknown',
      },
      device_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Unique device identifier',
      },
      location_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Geolocation data if available',
      },
      referrer: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'HTTP referrer URL',
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'User session identifier',
      },
      
      // Related entity references
      related_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        comment: 'For activities involving another user',
      },
      related_entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Type of related entity (event, transaction, etc.)',
      },
      related_entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of related entity',
      },
      
      // Metadata and additional data
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional activity-specific data',
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low',
        comment: 'Severity level for security/audit purposes',
      },
      is_suspicious: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Flag for suspicious activities',
      },
      
      // Timestamps
      activity_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the activity actually occurred',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 7. user_transactions table
    await queryInterface.createTable('user_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      payment_method_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'user_payment_methods', key: 'id' },
        onDelete: 'SET NULL',
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'events', key: 'id' },
        onDelete: 'SET NULL',
      },
      
      // Transaction Identifiers
      transaction_type: {
        type: Sequelize.ENUM('purchase', 'subscription', 'refund', 'withdrawal', 'deposit', 'transfer', 'reward', 'fee'),
        allowNull: false,
        comment: 'Type of transaction',
      },
      provider_transaction_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Transaction ID from payment provider',
      },
      
      // Amount and Currency
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Amount in smallest currency unit (e.g., cents)',
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
        comment: 'ISO currency code',
      },
      net_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Net amount after fees',
      },
      
      // Fee Information
      processing_fee: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Processing fee amount',
      },
      tax_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Tax amount',
      },
      
      // Status and Timeline
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'disputed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human-readable description',
      },
      
      // Product/Service Details
      item_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      item_type: {
        type: Sequelize.ENUM('event_ticket', 'subscription', 'digital_good', 'physical_good', 'service'),
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      
      // Provider Information
      payment_provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Stripe, PayPal, etc.',
      },
      provider_fee_breakdown: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Detailed fee breakdown from provider',
      },
      
      // Risk and Security
      risk_level: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'low',
      },
      fraud_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_flagged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      
      // Refund Information
      refund_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Amount refunded (if any)',
      },
      refund_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      
      // Dispute Information
      is_disputed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dispute_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dispute_resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      
      // Metadata
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional transaction data',
      },
      provider_metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Raw response from payment provider',
      },
      
      // Timestamps for various states
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      event_type: {
        type: Sequelize.ENUM('release', 'beta', 'tournament', 'community', 'maintenance', 'update'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      event_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      event_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_main_event: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      registration_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      max_participants: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Event participants table
    await queryInterface.createTable('event_participants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      registration_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      attendance_status: {
        type: Sequelize.ENUM('registered', 'confirmed', 'attended', 'cancelled', 'no_show'),
        allowNull: false,
        defaultValue: 'registered',
      },
    });

    // Conversations table
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      conversation_type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_message_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'conversation_messages', key: 'id' },
        onDelete: 'SET NULL',
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Conversation participants table
    await queryInterface.createTable('conversation_participants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Conversation messages table
    await queryInterface.createTable('conversation_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'CASCADE',
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      message_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Friend requests table
    await queryInterface.createTable('friend_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'blocked'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Support tickets table
    await queryInterface.createTable('support_tickets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'waiting_response', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'open',
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal',
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Support attachments table
    await queryInterface.createTable('support_attachments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'support_tickets', key: 'id' },
        onDelete: 'CASCADE',
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_data: {
        type: Sequelize.BLOB('long'),
        allowNull: false,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      mime_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Support responses table
    await queryInterface.createTable('support_responses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'support_tickets', key: 'id' },
        onDelete: 'CASCADE',
      },
      responder_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      response_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_internal_note: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // User activities table
    await queryInterface.createTable('user_activities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      activity_type: {
        type: Sequelize.ENUM(
          'login', 'logout', 'profile_view', 'profile_update', 'password_change', 'email_change',
          'payment_method_added', 'payment_method_removed', 'transaction_completed', 'event_registration',
          'event_cancellation', 'friend_request_sent', 'friend_request_accepted', 'friend_request_declined',
          'message_sent', 'support_ticket_created', 'support_ticket_updated', 'game_session_started',
          'game_session_ended', 'achievement_unlocked', 'level_up', 'item_purchased', 'subscription_started',
          'subscription_cancelled', 'content_created', 'content_shared', 'content_liked', 'content_commented',
          'search_performed', 'settings_updated', 'security_alert', 'system_notification'
        ),
        allowNull: false,
      },
      activity_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      device_type: {
        type: Sequelize.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
        allowNull: false,
        defaultValue: 'unknown',
      },
      device_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      location_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      referrer: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      related_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      related_entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      related_entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low',
      },
      is_suspicious: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      activity_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // User transactions table
    await queryInterface.createTable('user_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      payment_method_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'user_payment_methods', key: 'id' },
        onDelete: 'SET NULL',
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'events', key: 'id' },
        onDelete: 'SET NULL',
      },
      transaction_type: {
        type: Sequelize.ENUM('purchase', 'subscription', 'refund', 'withdrawal', 'deposit', 'transfer', 'reward', 'fee'),
        allowNull: false,
      },
      provider_transaction_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      net_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      processing_fee: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      tax_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'disputed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      item_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      item_type: {
        type: Sequelize.ENUM('event_ticket', 'subscription', 'digital_good', 'physical_good', 'service'),
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      payment_provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      provider_fee_breakdown: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      risk_level: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'low',
      },
      fraud_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_flagged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      refund_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      refund_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_disputed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dispute_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dispute_resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      provider_metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      failed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });

    await addIndexSafely('users', ['email']);
    await addIndexSafely('users', ['username']);
    await addIndexSafely('users', ['user_type']);
    await addIndexSafely('users', ['is_active']);
    await addIndexSafely('users', ['is_deleted']);
    await addIndexSafely('users', ['last_login']);
    await addIndexSafely('users', ['created_at']);
    await addIndexSafely('users', ['preferred_gameplay_type']);

    await addIndexSafely('user_locations', ['user_id']);
    await addIndexSafely('user_locations', ['address_type']);
    await addIndexSafely('user_locations', ['is_primary']);
    await addIndexSafely('user_locations', ['is_public']);
    await addIndexSafely('user_locations', ['country']);
    await addIndexSafely('user_locations', ['city']);
    await addIndexSafely('user_locations', ['postal_code']);

    await addIndexSafely('user_social_profiles', ['user_id']);
    await addIndexSafely('user_social_profiles', ['platform']);
    await addIndexSafely('user_social_profiles', ['is_public']);
    await addIndexSafely('user_social_profiles', ['username']);

    await addIndexSafely('user_payment_methods', ['user_id']);
    await addIndexSafely('user_payment_methods', ['method_type']);
    await addIndexSafely('user_payment_methods', ['provider']);
    await addIndexSafely('user_payment_methods', ['is_default']);
    await addIndexSafely('user_payment_methods', ['is_active']);
    await addIndexSafely('user_payment_methods', ['is_verified']);
    await addIndexSafely('user_payment_methods', ['card_brand']);
    await addIndexSafely('user_payment_methods', ['paypal_email']);
    await addIndexSafely('user_payment_methods', ['crypto_currency']);
    await addIndexSafely('user_payment_methods', ['billing_address_id']);
    await addIndexSafely('user_payment_methods', ['created_at']);

    await addIndexSafely('user_profiles', ['user_id']);
    await addIndexSafely('user_profiles', ['display_name']);

    await addIndexSafely('user_activities', ['user_id']);
    await addIndexSafely('user_activities', ['activity_type']);
    await addIndexSafely('user_activities', ['activity_timestamp']);
    await addIndexSafely('user_activities', ['ip_address']);
    await addIndexSafely('user_activities', ['device_type']);
    await addIndexSafely('user_activities', ['session_id']);
    await addIndexSafely('user_activities', ['is_suspicious']);
    await addIndexSafely('user_activities', ['severity']);
    await addIndexSafely('user_activities', ['related_user_id']);
    await addIndexSafely('user_activities', ['related_entity_type']);
    await addIndexSafely('user_activities', ['related_entity_id']);
    await addIndexSafely('user_activities', ['created_at']);

    await addIndexSafely('user_transactions', ['user_id']);
    await addIndexSafely('user_transactions', ['payment_method_id']);
    await addIndexSafely('user_transactions', ['event_id']);
    await addIndexSafely('user_transactions', ['transaction_type']);
    await addIndexSafely('user_transactions', ['status']);
    await addIndexSafely('user_transactions', ['payment_provider']);
    await addIndexSafely('user_transactions', ['amount']);
    await addIndexSafely('user_transactions', ['currency']);
    await addIndexSafely('user_transactions', ['risk_level']);
    await addIndexSafely('user_transactions', ['is_flagged']);
    await addIndexSafely('user_transactions', ['is_disputed']);
    await addIndexSafely('user_transactions', ['created_at']);
    await addIndexSafely('user_transactions', ['completed_at']);
    await addIndexSafely('user_transactions', ['provider_transaction_id']);

    await addIndexSafely('events', ['event_type']);
    await addIndexSafely('events', ['event_date']);
    await addIndexSafely('events', ['end_date']);
    await addIndexSafely('events', ['is_featured']);
    await addIndexSafely('events', ['is_main_event']);
    await addIndexSafely('events', ['registration_required']);
    await addIndexSafely('events', ['created_by']);
    await addIndexSafely('events', ['created_at']);

    await addIndexSafely('event_participants', ['event_id']);
    await addIndexSafely('event_participants', ['user_id']);
    await addIndexSafely('event_participants', ['attendance_status']);
    await addIndexSafely('event_participants', ['registration_date']);

    await addIndexSafely('conversations', ['conversation_type']);
    await addIndexSafely('conversations', ['last_message_at']);
    await addIndexSafely('conversations', ['created_at']);

    await addIndexSafely('conversation_participants', ['conversation_id']);
    await addIndexSafely('conversation_participants', ['user_id']);
    await addIndexSafely('conversation_participants', ['is_active']);

    await addIndexSafely('conversation_messages', ['conversation_id']);
    await addIndexSafely('conversation_messages', ['sender_id']);
    await addIndexSafely('conversation_messages', ['created_at']);
    await addIndexSafely('conversation_messages', ['is_read']);
    await addIndexSafely('conversation_messages', ['is_edited']);

    await addIndexSafely('friend_requests', ['sender_id']);
    await addIndexSafely('friend_requests', ['receiver_id']);
    await addIndexSafely('friend_requests', ['status']);
    await addIndexSafely('friend_requests', ['created_at']);
    await addIndexSafely('friend_requests', ['updated_at']);

    await addIndexSafely('support_tickets', ['user_id']);
    await addIndexSafely('support_tickets', ['email']);
    await addIndexSafely('support_tickets', ['status']);
    await addIndexSafely('support_tickets', ['priority']);
    await addIndexSafely('support_tickets', ['assigned_to']);
    await addIndexSafely('support_tickets', ['created_at']);
    await addIndexSafely('support_tickets', ['updated_at']);

    await addIndexSafely('support_attachments', ['ticket_id']);
    await addIndexSafely('support_attachments', ['uploaded_at']);

    await addIndexSafely('support_responses', ['ticket_id']);
    await addIndexSafely('support_responses', ['responder_id']);
    await addIndexSafely('support_responses', ['created_at']);
    await addIndexSafely('support_responses', ['is_internal_note']);

    await addIndexSafely('user_activities', ['user_id', 'activity_timestamp']);
    await addIndexSafely('user_activities', ['activity_type', 'activity_timestamp']);
    
    await addIndexSafely('user_transactions', ['user_id', 'created_at']);
    await addIndexSafely('user_transactions', ['status', 'created_at']);
    await addIndexSafely('user_transactions', ['transaction_type', 'created_at']);
    
    await addIndexSafely('events', ['event_date', 'is_featured']);
    await addIndexSafely('events', ['event_type', 'event_date']);
    
    await addIndexSafely('conversation_messages', ['conversation_id', 'created_at']);
    await addIndexSafely('conversation_messages', ['sender_id', 'created_at']);
    
    await addIndexSafely('friend_requests', ['sender_id', 'status']);
    await addIndexSafely('friend_requests', ['receiver_id', 'status']);
    await addIndexSafely('friend_requests', ['status', 'created_at']);
    
    await addIndexSafely('support_tickets', ['status', 'priority']);
    await addIndexSafely('support_tickets', ['assigned_to', 'status']);
    await addIndexSafely('support_tickets', ['created_at', 'status']);

    
    await addConstraintSafely('user_payment_methods', {
      fields: ['provider_payment_method_id'],
      type: 'unique',
      name: 'unique_provider_payment_method_id'
    });

    await addConstraintSafely('user_transactions', {
      fields: ['provider_transaction_id'],
      type: 'unique',
      name: 'unique_provider_transaction_id'
    });

    await addConstraintSafely('friend_requests', {
      fields: ['sender_id', 'receiver_id'],
      type: 'unique',
      name: 'unique_friend_request_pair'
    });

    await addConstraintSafely('conversation_participants', {
      fields: ['conversation_id', 'user_id'],
      type: 'unique',
      name: 'unique_conversation_participant'
    });

    await addConstraintSafely('event_participants', {
      fields: ['event_id', 'user_id'],
      type: 'unique',
      name: 'unique_event_participation'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation to respect foreign key constraints
    await queryInterface.dropTable('user_transactions');
    await queryInterface.dropTable('user_activities');
    await queryInterface.dropTable('user_payment_methods');
    await queryInterface.dropTable('user_profiles');
    await queryInterface.dropTable('user_social_profiles');
    await queryInterface.dropTable('user_locations');
    await queryInterface.dropTable('users');
  }
};
