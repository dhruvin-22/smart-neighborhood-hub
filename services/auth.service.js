const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect email or password');
  }
  if (!user.emailVerified) {
    throw new ApiError(httpStatus.LOCKED, 'Please check your email and verify it to continue login in to app');
  }
  return user;
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, 'refresh');
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @returns {Promise}
 * @param resetPasswordRequest
 * @param {string} [resetPasswordRequest.password]
 * @param {string} [resetPasswordRequest.code]
 * @param {string} [resetPasswordRequest.email]
 */
const resetPassword = async (resetPasswordRequest) => {
  const { email, code, password } = resetPasswordRequest;
  const resetPasswordTokenDoc = await tokenService.verifyCode({ email, type: 'resetPassword', code });
  const { user } = resetPasswordTokenDoc;
  await Token.deleteMany({ user, type: 'resetPassword' });
  return userService.updateUserById(user, { password });
};

module.exports = {
  loginUserWithEmailAndPassword,
  refreshAuth,
  resetPassword,
};
