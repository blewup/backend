'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_authentication', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      totp_secret: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      totp_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      sms_2fa_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cookie_consent_accepted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      cookie_consent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_verification: {
        type: Sequelize.DATE,
        allowNull: true
      },
      session_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      session_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('user_authentication', ['phone_number'], {
      unique: true,
      where: {
        phone_number: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_authentication');
  }
};
