const { z } = require('zod');

const UserBase = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30)
});

const UserCreate = UserBase.extend({
  password: z.string().min(6)
});

const UserUpdate = z.object({
  real_name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  is_real_name_public: z.boolean().optional(),
  is_location_public: z.boolean().optional()
});

const User = UserBase.extend({
  id: z.number().int(),
  real_name: z.string().nullable(),
  location: z.string().nullable(),
  is_active: z.boolean()
});

// ===== Token Schemas =====

const Token = z.object({
  access_token: z.string(),
  token_type: z.literal('bearer')
});

const TokenData = z.object({
  username: z.string().optional().nullable()
});

module.exports = {
  UserBase,
  UserCreate,
  UserUpdate,
  User,
  Token,
  TokenData
};