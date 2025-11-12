'use strict';

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d',
    algorithm: 'HS256',
    issuer: 'kusher.space',
    audience: ['game', 'website']
  },
  session: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    requireReVerification: true,
    reVerificationInterval: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  verificationCodes: {
    expiresIn: 5 * 60 * 1000, // 5 minutes
    rateLimit: 6 * 60 * 1000 // 6 minutes
  },
  passwords: {
    saltRounds: 12,
    minLength: 8,
    requireNumbers: true,
    requireSymbols: true,
    requireUppercase: true,
    requireLowercase: true
  },
  twoFactor: {
    totp: {
      issuer: 'Kusher Space Game',
      algorithm: 'sha256',
      digits: 6,
      step: 30
    },
    sms: {
      provider: 'twilio', // or 'vonage'
      codeLength: 6,
      messageTemplate: 'Your Kusher Space verification code is: {code}'
    }
  }
};