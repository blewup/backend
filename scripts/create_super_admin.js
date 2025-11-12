const AuthUtils = require('../utils/auth');
const { User } = require('../models');

async function createSuperAdmin() {
    try {
        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({
            where: { user_type: 'super_admin' }
        });

        if (existingSuperAdmin) {
            console.log('Super admin already exists');
            return;
        }

        // Create super admin account
        const superAdmin = await AuthUtils.createSuperAdmin(
            'admin@kusher.space',
            'Christina4032', // Initial password
            'kusher_admin'
        );

        console.log('Super admin created successfully:', {
            id: superAdmin.id,
            username: superAdmin.username,
            email: superAdmin.email
        });

        console.log('Please change the password after first login!');
    } catch (error) {
        console.error('Error creating super admin:', error);
    } finally {
        process.exit();
    }
}

createSuperAdmin();