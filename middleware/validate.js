const { validationResult } = require('express-validator');

const validate = validations => {
  return async (req, res, next) => {
    try {
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      const error = new Error('Validation failed');
      error.status = 400;
      error.errors = errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }));
      throw error;
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;