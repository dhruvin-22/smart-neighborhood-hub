const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const { Token, User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
  };
  return jwt.sign(payload, secret);
};

/**
 * Generate token
 * @returns {string}
 * @param length
 */
const generateCode = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * charactersLength))).join('');
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret, { ignoreExpiration: true });
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
  }
  return tokenDoc;
};

/**
 * Verify Code
 * @returns {Promise<Token>}
 * @param verificationRequest
 * @param {string} [verificationRequest.token]
 * @param {string} [verificationRequest.type]
 * @param {string} [verificationRequest.user]
 */
const verifyCode = async (verificationRequest) => {
  const { code: token, type, email } = verificationRequest;
  const userObj = await userService.getUserByEmail(email);
  if (!userObj) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No such User');
  }
  const tokenDoc = await Token.findOne({ token, type, user: userObj._id, blacklisted: false });
  if (!tokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Incorrect code');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires);
  await saveToken(refreshToken, user.id, refreshTokenExpires, 'refresh');

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateCode(config.jwt.resetPasswordCodeSize);
  await Token.deleteMany({ user, type: 'resetPassword' });
  await saveToken(resetPasswordToken, user.id, expires, 'resetPassword');
  return resetPasswordToken;
};

/**
 * Generate Verify email token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  } else if (user.emailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is already Verified');
  }
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires);
  await Token.deleteMany({ user, type: 'verifyEmail' });
  await saveToken(resetPasswordToken, user.id, expires, 'verifyEmail');
  return resetPasswordToken;
};

/**
 * Get auth tokens
 * @param {User} user
 * @param token
 * @returns {Promise<Object>}
 */
const getAuthTokens = async (user, token) => {
  const tokenDoc = await Token.findOne({ type: 'refresh', user: user.id, blacklisted: false });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  const { exp } = jwt.verify(token, config.jwt.secret);

  return {
    access: {
      token,
      expires: moment.unix(exp).toDate(),
    },
    refresh: {
      token: tokenDoc.token,
      expires: tokenDoc.expires,
    },
  };
};

/**
 * @returns {Promise<*>}
 * @param {Object}  invalidReq
 */
const invalidateToken = async (invalidReq) => {
  const { refreshToken: token, deviceToken } = invalidReq;
  const tokenDoc = await Token.findOne({ type: 'refresh', token, blacklisted: false });
  if (!tokenDoc) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token not found');
  } else {
    await User.findByIdAndUpdate(tokenDoc.user, { $pull: { deviceTokens: deviceToken } });
    return Token.findByIdAndUpdate(tokenDoc._id, { $set: { blacklisted: true } });
  }
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  verifyCode,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  getAuthTokens,
  invalidateToken,
};
