'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserPaymentMethod extends Model {
    static associate(models) {
      UserPaymentMethod.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      UserPaymentMethod.hasMany(models.UserTransaction, {
        foreignKey: 'payment_method_id',
        as: 'transactions'
      });
    }
  }

  UserPaymentMethod.init({
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
    method_type: {
      type: DataTypes.ENUM('credit_card', 'debit_card', 'paypal', 'crypto', 'bank_transfer', 'wallet'),
      allowNull: false,
      comment: 'Type of payment method'
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Payment provider (Stripe, PayPal, etc.)'
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this is the default payment method'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this payment method is active'
    },

    card_last_four: {
      type: DataTypes.STRING(4),
      allowNull: true,
      comment: 'Last 4 digits of card'
    },
    card_brand: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Visa, MasterCard, Amex, etc.'
    },
    card_exp_month: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12
      }
    },
    card_exp_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: new Date().getFullYear()
      }
    },

    paypal_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },

    crypto_wallet_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    crypto_currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'BTC, ETH, USDT, etc.'
    },

    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bank_account_last_four: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    bank_routing_number: {
      type: DataTypes.STRING(9),
      allowNull: true
    },

    provider_customer_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Customer ID from payment provider'
    },
    provider_payment_method_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Payment method ID from provider'
    },

    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether payment method has been verified'
    },
    verification_token: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Token for payment method verification'
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional provider-specific data'
    }
  }, {
    sequelize,
    modelName: 'UserPaymentMethod',
    tableName: 'user_payment_methods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['method_type']
      },
      {
        fields: ['provider']
      },
      {
        fields: ['is_default']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['provider_payment_method_id']
      }
    ],
    hooks: {
      beforeSave: async (paymentMethod) => {
        // Ensure only one default payment method per user
        if (paymentMethod.is_default) {
          await UserPaymentMethod.update(
            { is_default: false },
            {
              where: {
                user_id: paymentMethod.user_id,
                id: { [sequelize.Op.ne]: paymentMethod.id }
              }
            }
          );
        }
      }
    }
  });

  return UserPaymentMethod;
};