require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const WebSocket = require('socket.io');
const db = require('./models');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { 
  corsOptions, 
  rateLimitOptions, 
  helmetOptions, 
  compressionOptions,
  passportJWTOptions 
} = require('./config/middleware');

// Import API routes
const Auth = require('./routes/auth.js');
const Events = require('./routes/events.js');
const Friend = require('./routes/friend.js');
const Social = require('./routes/user_social.js');
const Conversation = require('./routes/conversation.js');
const Upload = require('./routes/upload.js');
const Alliance = require('./routes/alliance.js');
const Alliance_Member = require('./routes/alliance_member.js');
const Support = require('./routes/support.js');
const Files = require('./routes/files.js');
const Game = require('./routes/game.js');
const User = require('./routes/user.js');
const Admin = require('./routes/admin.js');
const Search = require('./routes/search.js');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = process.env.HOST || process.env.SERVER_HOST || '0.0.0.0';
const rawBaseUrl = process.env.APP_BASE_URL || `http://${HOST}:${PORT}`;
const APP_BASE_URL = rawBaseUrl.replace(/\/$/, '');
const baseWithoutApiSuffix = APP_BASE_URL.endsWith('/api') ? APP_BASE_URL.slice(0, -4) : APP_BASE_URL;
const API_BASE_URL = `${baseWithoutApiSuffix}/api`;

// Security middleware
app.use(cors(corsOptions));
app.use(helmet(helmetOptions));
app.use(rateLimit(rateLimitOptions));
app.use(compression(compressionOptions));
app.use(cookieParser());

// Request parsing middleware
app.use(express.json({ limit: '64mb' }));
app.use(express.urlencoded({ extended: true, limit: '64mb' }));

// Logging middleware
app.use(morgan('dev'));

// Authentication middleware
app.use(passport.initialize());
passport.use(new JwtStrategy(passportJWTOptions, async (jwtPayload, done) => {
  try {
    const user = await db.User.findByPk(jwtPayload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

app.use('/api/user', User);
app.use('/api/auth', Auth);
app.use('/api/events', Events);
app.use('/api/friend', Friend);
app.use('/api/user_social', Social);
app.use('/api/upload', Upload);
app.use('/api/conversation', Conversation);
app.use('/api/files', Files);
app.use('/api/game', Game);
app.use('/api/support', Support);
app.use('/api/alliance', Alliance);
app.use('/api/alliance_member', Alliance_Member);
app.use('/api/admin', Admin);
app.use('/api', Search);

// Health check
app.get('/api/status', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Kusher Backend is running!',
    database: db.sequelize.config.database,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

async function initializeApp() {
  try {
    // Test database connection
    await db.testConnection();
    
    const shouldSync = process.env.DB_AUTO_SYNC === 'true';
    if (shouldSync) {
      const syncOptions = {
        force: process.env.DB_SYNC_FORCE === 'true',
        alter: process.env.DB_SYNC_ALTER === 'true'
      };
      console.log(`🔄 Running sequelize.sync with options: ${JSON.stringify(syncOptions)}`);
      await db.sequelize.sync(syncOptions);
      console.log('✅ Database synchronized successfully');
    } else {
      console.log('ℹ️ DB_AUTO_SYNC is not true; skipping sequelize.sync() (migrations should manage schema).');
    }

    // Create HTTP server
    const server = require('http').createServer(app);
    
    // Set up WebSocket
    const setupWebSocket = require('./websocket');
    const io = setupWebSocket(server);
    
    // Make io available to the express app
    app.set('io', io);
    


    // Serve static files from frontend directory (CSS, JS, images, etc.)
    app.use(express.static(path.join(__dirname, '../frontend')));

    // Apply error handling middleware
    app.use(errorHandler);

    // Custom 404 handler for API routes
    app.all('/api/*', notFoundHandler);

    // Catch-all route for SPA - serves index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Kusher App running on ${APP_BASE_URL}`);
      console.log(`📊 API available at ${API_BASE_URL}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`🗄️ Database: ${db.sequelize.config.database}`);
      console.log('📋 Available API Routes:');
      console.log('  /api/auth/* - Authentication routes');
      console.log('  /api/events/* - Event management');
      console.log('  /api/social/* - Social profiles');
      console.log('  /api/friends/* - Friend system');
      console.log('  /api/conversations/* - Messaging');
      console.log('  /api/support/* - Support tickets');
      console.log('  /api/status - Health check');
    });
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

initializeApp();