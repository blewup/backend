const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const allianceRoutes = require('./routes/alliance');
const eventsRoutes = require('./routes/events');
const supportRoutes = require('./routes/support');
const gameRoutes = require('./routes/game');
const uploadRoutes = require('./routes/upload');

// API routes configuration
const setupApiRoutes = (app) => {
    // Health check endpoint
    router.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date() });
    });

    // Mount all routes
    router.use('/auth', authRoutes);
    router.use('/users', userRoutes);
    router.use('/alliances', allianceRoutes);
    router.use('/events', eventsRoutes);
    router.use('/support', supportRoutes);
    router.use('/game', gameRoutes);
    router.use('/upload', uploadRoutes);

    // Version the API
    app.use('/api/v1', router);

    // Handle 404 errors for API routes
    app.use('/api/*', (req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: 'The requested API endpoint does not exist'
        });
    });
};

module.exports = setupApiRoutes;