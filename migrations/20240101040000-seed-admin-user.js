'use strict';
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (error) {
  try {
    bcrypt = require('bcryptjs');
  } catch (fallbackError) {
    throw new Error('Neither bcrypt nor bcryptjs modules are available. Install one of them before running the seed-admin-user migration.');
  }
}
const config = require('../config/auth');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();
      const username = 'kusher_shurukn';
      const email = 'support@kusher.space';
      const passwordHash = await bcrypt.hash('Christina4032', config.passwords.saltRounds);

      const usersTable = await queryInterface.describeTable('users').catch(() => null);
      if (!usersTable) {
        console.warn('⚠️  Skipping seed-admin-user migration: users table not found');
        await transaction.rollback();
        return;
      }

      const [existingUser] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        {
          replacements: [username],
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      let userId = existingUser ? existingUser.id : null;

      if (!userId) {
        await queryInterface.bulkInsert('users', [{
          username,
          email,
          password_hash: passwordHash,
          user_type: 'super_admin',
          is_active: true,
          is_deleted: false,
          profile_cleared: false,
          created_at: now,
          updated_at: now
        }], { transaction });

        const insertedUsers = await queryInterface.sequelize.query(
          'SELECT id FROM users WHERE username = ? LIMIT 1',
          {
            replacements: [username],
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        userId = insertedUsers.length ? insertedUsers[0].id : null;
      } else {
        const updatedValues = {
          email,
          password_hash: passwordHash,
          user_type: 'super_admin',
          is_active: true,
          is_deleted: false,
          updated_at: now
        };

        if (usersTable.is_admin) {
          updatedValues.is_admin = true;
        }

        await queryInterface.bulkUpdate('users', updatedValues, { id: userId }, { transaction });
      }

      if (!userId) {
        throw new Error('Failed to ensure super admin user exists');
      }

      const authTable = await queryInterface.describeTable('user_authentication').catch(() => null);
      if (authTable) {
        await queryInterface.sequelize.query(
          `INSERT INTO user_authentication (
            user_id, email_verified, email_verified_at, cookie_consent_accepted,
            cookie_consent_at, created_at, updated_at
          ) VALUES (?, TRUE, ?, TRUE, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            email_verified = VALUES(email_verified),
            email_verified_at = VALUES(email_verified_at),
            cookie_consent_accepted = VALUES(cookie_consent_accepted),
            cookie_consent_at = VALUES(cookie_consent_at),
            updated_at = VALUES(updated_at);`,
          {
            replacements: [userId, now, now, now, now, now],
            transaction
          }
        );
      }

      const gameDataTable = await queryInterface.describeTable('user_game_data').catch(() => null);
      if (gameDataTable) {
        await queryInterface.sequelize.query(
          `INSERT INTO user_game_data (
            user_id, ruks_balance, inventory_slots, health, current_planet,
            owned_weapons, active_effects, created_at, updated_at
          ) VALUES (?, 1000000, 72, 100, 'Earth', ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            ruks_balance = VALUES(ruks_balance),
            inventory_slots = VALUES(inventory_slots),
            health = VALUES(health),
            current_planet = VALUES(current_planet),
            owned_weapons = VALUES(owned_weapons),
            active_effects = VALUES(active_effects),
            updated_at = VALUES(updated_at);`,
          {
            replacements: [userId, JSON.stringify([]), JSON.stringify([]), now, now],
            transaction
          }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const username = 'kusher_shurukn';

      await queryInterface.bulkDelete('user_game_data', {
        user_id: {
          [Sequelize.Op.in]: queryInterface.sequelize.literal(
            `(SELECT id FROM users WHERE username = '${username}')`
          )
        }
      }, { transaction });

      await queryInterface.bulkDelete('user_authentication', {
        user_id: {
          [Sequelize.Op.in]: queryInterface.sequelize.literal(
            `(SELECT id FROM users WHERE username = '${username}')`
          )
        }
      }, { transaction });

      await queryInterface.bulkDelete('users', {
        username
      }, { transaction });
    });
  }
};
