'use strict';

module.exports = {
  async up() {
    console.log('Skipping legacy migration create-user-authentication.js (replaced by timestamped version).');
  },

  async down() {
    // No-op
  }
};