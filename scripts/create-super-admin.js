#!/usr/bin/env node
'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

/**
 * Create or update the super admin user
 */
async function createSuperAdmin() {
  try {
    console.log('🔧 Creating/Updating Super Admin...');

    const sequelize = db.sequelize;
    if (!sequelize) {
      console.warn('⚠️ Sequelize instance unavailable; skipping super admin sync.');
      return null;
    }

    const queryInterface = sequelize.getQueryInterface();
    const usersTable = await queryInterface.describeTable('users').catch(() => null);
    if (!usersTable) {
      console.warn('⚠️ users table not found. Skipping super admin creation. Run migrations first.');
      return null;
    }

    const username = process.env.SUPER_ADMIN_USERNAME || 'kusher_shurukn';
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@kusher.space';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Christina4032';
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Billy';
    const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'St-Hilaire';
    const preferExisting = process.env.SUPER_ADMIN_PREFER_EXISTING !== 'false';
    const syncProfile = process.env.SUPER_ADMIN_SYNC_PROFILE !== 'false';
    const resetPassword = process.env.SUPER_ADMIN_RESET_PASSWORD === 'true';

    const userModel = db.User || db.sequelize?.models?.User;
    if (!userModel) {
      console.warn('⚠️ User model is not available in this context. Skipping super admin sync.');
      return null;
    }

    const profileModel = db.UserProfile || sequelize?.models?.UserProfile;

    const baseQuery = typeof userModel.unscoped === 'function'
      ? userModel.unscoped()
      : (typeof userModel.scope === 'function' ? userModel.scope(null) : userModel);

    let superAdmin = await baseQuery.findOne({ where: { username } });

    if (!superAdmin && preferExisting) {
      superAdmin = await baseQuery.findOne({
        where: { user_type: 'super_admin' },
        order: [['id', 'ASC']]
      });
      if (superAdmin) {
        console.log(`ℹ️ Using existing super admin '${superAdmin.username}' from database.`);
      }
    }

    if (!superAdmin) {
      const passwordHash = await bcrypt.hash(password, 10);
      superAdmin = await userModel.create({
        username,
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        user_type: 'super_admin',
        is_active: true,
        is_deleted: false,
        ...(userModel.rawAttributes?.is_admin ? { is_admin: true } : {}),
        biography: 'Super Administrator - Full system access',
        preferred_gameplay_type: 'social'
      });
      console.log(`✅ Super Admin '${username}' created successfully`);
    } else {
      const updatePayload = {
        user_type: 'super_admin',
        is_active: true,
        is_deleted: false,
        ...(userModel.rawAttributes?.is_admin ? { is_admin: true } : {})
      };

      if (syncProfile) {
        Object.assign(updatePayload, {
          email,
          first_name: firstName,
          last_name: lastName
        });
      }

      if (resetPassword) {
        updatePayload.password_hash = await bcrypt.hash(password, 10);
      } else {
        console.log('ℹ️ SUPER_ADMIN_RESET_PASSWORD is not set to true; preserving existing password hash.');
      }

      await superAdmin.update(updatePayload);
      console.log(`✅ Super Admin '${superAdmin.username}' updated successfully`);
    }

    if (!profileModel) {
      console.warn('⚠️ UserProfile model not loaded; skipping profile sync.');
    } else if (syncProfile) {
      const profileTable = await queryInterface.describeTable('user_profiles').catch(() => null);
      if (!profileTable) {
        console.warn('⚠️ user_profiles table not found; skipping profile sync.');
      } else {
        const profilePayload = {
          user_id: superAdmin.id,
          display_name: `${firstName} "${superAdmin.username}" ${lastName}`,
          privacy_settings: {
            visibility: 'public',
            show_online_status: true
          },
          notification_settings: {
            allow_friend_requests: true,
            weekly_digest: false
          },
          game_stats: {
            events_hosted: 0,
            alliances_led: 0
          }
        };

        const profile = await profileModel.findOne({ where: { user_id: superAdmin.id } });

        if (!profile) {
          await profileModel.create(profilePayload);
          console.log('✅ Super Admin profile created');
        } else {
          await profile.update(profilePayload);
          console.log('✅ Super Admin profile updated');
        }
      }
    } else {
      console.log('ℹ️ SUPER_ADMIN_SYNC_PROFILE disabled; skipping profile updates.');
    }
    
    console.log('\n📋 Super Admin Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Type: super_admin`);
    console.log(`   ID: ${superAdmin.id}`);
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('\n✅ Super admin setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Super admin setup failed:', error);
      process.exit(1);
    });
}

module.exports = createSuperAdmin;
