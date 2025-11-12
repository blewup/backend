#!/usr/bin/env node

/**
 * Entry point for Kusher Space application on cPanel/shared hosting
 * This file should be set as the startup file in cPanel Node.js app settings
 */

const path = require('path');

// Set NODE_ENV to production if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Start the server
require('./server.js');