const db = require('../models');

async function initializeDatabase() {
  try {
    // Test connection
    await db.testConnection();
    
    // Sync all models with database
    // Use { force: true } to drop and recreate tables (DANGEROUS in production)
    // Use { alter: true } to sync without dropping data
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: true } 
      : { alter: true };
    
    await db.sequelize.sync(syncOptions);
    console.log('✅ Database synchronized successfully');
    
    // You can add initial data here if needed
    // await seedInitialData();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;