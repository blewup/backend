'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserTransaction extends Model {
    static associate(models) {
      // FIXED: Change .user() to .belongsTo()
      UserTransaction.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      UserTransaction.belongsTo(models.UserPaymentMethod, {
        foreignKey: 'payment_method_id',
        as: 'paymentMethod'
      });
      
      UserTransaction.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event'
      });
    }
    
    // KEEP ALL YOUR ORIGINAL METHODS
    isRefundable() {
      const refundableStatuses = ['completed', 'succeeded'];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30-day refund window
      
      return refundableStatuses.includes(this.status) && 
             this.created_at > cutoffDate;
    }

    getFormattedAmount() {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency
      }).format(this.amount / 100); // Assuming amount is in cents
    }
  }

  // KEEP ALL YOUR ORIGINAL UserTransaction.init CONFIGURATION
  UserTransaction.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user_payment_methods',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    
    // Transaction Identifiers
    transaction_type: {
      type: DataTypes.ENUM(
        'purchase', 
        'subscription', 
        'refund', 
        'withdrawal',
        'deposit',
        'transfer',
        'reward',
        'fee'
      ),
      allowNull: false,
      comment: 'Type of transaction'
    },
    provider_transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Transaction ID from payment provider'
    },
    
    // Amount and Currency
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Amount in smallest currency unit (e.g., cents)',
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      comment: 'ISO currency code'
    },
    net_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Net amount after fees'
    },
    
    // Fee Information
    processing_fee: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Processing fee amount'
    },
    tax_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Tax amount'
    },
    
    // Status and Timeline
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing', 
        'completed',
        'succeeded',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded',
        'disputed'
      ),
      allowNull: false,
      defaultValue: 'pending'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description'
    },
    
    // Product/Service Details
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    item_type: {
      type: DataTypes.ENUM('event_ticket', 'subscription', 'digital_good', 'physical_good', 'service'),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    
    // Provider Information
    payment_provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Stripe, PayPal, etc.'
    },
    provider_fee_breakdown: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Detailed fee breakdown from provider'
    },
    
    // Risk and Security
    risk_level: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'low'
    },
    fraud_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    is_flagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    
    // Refund Information
    refund_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Amount refunded (if any)'
    },
    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Dispute Information
    is_disputed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    dispute_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dispute_resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional transaction data'
    },
    provider_metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Raw response from payment provider'
    },
    
    // Timestamps for various states
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserTransaction',
    tableName: 'user_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['payment_method_id']
      },
      {
        fields: ['event_id']
      },
      {
        fields: ['transaction_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['payment_provider']
      },
      {
        unique: true,
        fields: ['provider_transaction_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['amount']
      }
    ],
    hooks: {
      beforeUpdate: (transaction) => {
        if (transaction.changed('status') && 
            ['completed', 'succeeded'].includes(transaction.status) &&
            !transaction.completed_at) {
          transaction.completed_at = new Date();
        }

        if (transaction.changed('refund_amount') && 
            transaction.refund_amount > 0 && 
            !transaction.refunded_at) {
          transaction.refunded_at = new Date();
        }
      }
    }
  });

  return UserTransaction;
};