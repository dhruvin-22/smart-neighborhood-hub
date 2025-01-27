const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const { password } = require('./custom.validation');
const config = require('../config/config');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    last_name: Joi.string().required(),
    display_name: Joi.string().trim().messages({
      'string.base': `"Display name" should be a type of 'text'`,
      'string.empty': `"Display name" is not allowed to be empty`,
      'any.required': `"Display name" is a required.`,
    }),
    date_of_birth: Joi.date()
      .format('DD/MM/YYYY')
      .max(new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 18))
      .message('Age Should be Greater than 18')
      .raw()
      .required(),
    privacy: Joi.string().required(),
    deviceToken: Joi.string().allow(''),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    deviceToken: Joi.string().allow(''),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const verifyCode = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    code: Joi.string().length(config.jwt.resetPasswordCodeSize).required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
    email: Joi.string().email().required(),
    code: Joi.string().length(config.jwt.resetPasswordCodeSize).required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
    deviceToken: Joi.string().allow(''),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const updateUserInfo = {
  body: Joi.object().keys({
    display_name: Joi.string().trim().messages({
      'string.base': `"Display name" should be a type of 'text'`,
      'string.empty': `"Display name" is not allowed to be empty`,
      'any.required': `"Display name" is a required.`,
    }),
    profileImage: Joi.string(),
  }),
};

module.exports = {
  register,
  login,
  refreshTokens,
  forgotPassword,
  verifyCode,
  resetPassword,
  logout,
  changePassword,
  updateUserInfo,
};
