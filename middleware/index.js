const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'https://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// Middleware setup function
const setupMiddleware = (app) => {
    // Security middleware
    app.use(helmet());
    app.use(cors(corsOptions));
    app.use(limiter);

    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Custom middleware
    app.use('/api', authenticateToken);
    app.use(errorHandler);
};

module.exports = {
    setupMiddleware,
    authenticateToken,
    errorHandler
};