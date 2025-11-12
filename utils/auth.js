const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const ACCESS_TOKEN_EXPIRE_MINUTES = process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 60 * 24 * 7; // 7 days default

async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

async function getPasswordHash(password) {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

function createAccessToken(data, options = {}) {
  const toEncode = { ...data };
  const expiresDelta = options.expiresDelta || ACCESS_TOKEN_EXPIRE_MINUTES;
  
  // Calculate expiry date
  const expire = new Date();
  expire.setMinutes(expire.getMinutes() + expiresDelta);
  
  toEncode.exp = Math.floor(expire.getTime() / 1000); // JWT expects seconds
  
  return jwt.sign(toEncode, JWT_SECRET, { algorithm: 'HS256' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

function getUserIdFromToken(token) {
  const decoded = verifyToken(token);
  return decoded ? decoded.userId || decoded.sub : null;
}

module.exports = {
  verifyPassword,
  getPasswordHash,
  createAccessToken,
  verifyToken,
  getUserIdFromToken,
  SALT_ROUNDS,
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRE_MINUTES
};