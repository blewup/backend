const { body, param, query } = require('express-validator');

const allianceValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Alliance name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('alliance_type')
      .isIn(['casual', 'competitive', 'roleplay', 'trading', 'exploration', 'combat', 'builder', 'social', 'mixed'])
      .withMessage('Invalid alliance type'),
    body('membership_type')
      .isIn(['open', 'approval', 'invite_only', 'closed'])
      .withMessage('Invalid membership type'),
    body('max_members')
      .optional()
      .isInt({ min: 2, max: 1000 })
      .withMessage('Max members must be between 2 and 1000')
  ],
  update: [
    param('id').isInt().withMessage('Invalid alliance ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Alliance name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters')
  ],
  delete: [
    param('id').isInt().withMessage('Invalid alliance ID')
  ]
};

const npcValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('NPC name must be between 2 and 100 characters'),
    body('alliance_id')
      .isInt()
      .withMessage('Invalid alliance ID'),
    body('role')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Role must be between 2 and 100 characters'),
    body('level')
      .isInt({ min: 1, max: 100 })
      .withMessage('Level must be between 1 and 100')
  ]
};

const eventValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Event title must be between 3 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('event_type')
      .isIn(['tournament', 'holiday', 'community', 'update', 'beta', 'release', 'maintenance'])
      .withMessage('Invalid event type'),
    body('event_date')
      .isISO8601()
      .withMessage('Invalid event date'),
    body('max_participants')
      .optional()
      .isInt({ min: 2 })
      .withMessage('Maximum participants must be at least 2')
  ]
};

const userValidation = {
  create: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  update: [
    body('first_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('First name cannot exceed 100 characters'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Last name cannot exceed 100 characters'),
    body('biography')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Biography cannot exceed 2000 characters')
  ]
};

module.exports = {
  allianceValidation,
  npcValidation,
  eventValidation,
  userValidation
};