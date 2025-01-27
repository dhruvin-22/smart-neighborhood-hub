const httpStatus = require('http-status');
const _ = require('lodash');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (req, res) => {
  req.body.deviceTokens = req.body.deviceToken ? [req.body.deviceToken] : [];
  const user = await userService.createUser(req.body);
  const emailVerifyToken = await tokenService.generateVerifyEmailToken(user.email);
  emailService.sendEmailVerificationEmail(user, emailVerifyToken).then().catch();
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Email has been sent to your registered email. Please check your email and verify it',
    user,
    tokens,
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password, deviceToken } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  if (deviceToken) {
    if (_.indexOf(user.deviceTokens, deviceToken) === -1) {
      user.deviceTokens.push(deviceToken);
      if (deviceToken) await userService.updateUserById(user._id, user);
    }
  }
  res.send({ user, tokens });
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.OK).send({ success: true, message: 'Code has been sent' });
});

const verifyCode = catchAsync(async (req, res) => {
  req.body.type = 'resetPassword';
  await tokenService.verifyCode(req.body);
  res.status(httpStatus.OK).send({ success: true });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body);
  res.status(httpStatus.OK).send({ success: true, message: 'Password has been reset successfully' });
});

const userInfo = catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization || '';
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
  }
  const userObj = await userService.getUserById(req.user._id);
  const tokens = await tokenService.getAuthTokens(req.user, token);
  res.send({ user: userObj, tokens });
});

const logout = catchAsync(async (req, res) => {
  await tokenService.invalidateToken(req.body);
  res.send({ success: true });
});

const changePassword = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user._id, req.body);
  res.send({ user });
});

const updateUserInfo = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user._id, req.body);
  res.send({ user });
});

module.exports = {
  register,
  login,
  refreshTokens,
  forgotPassword,
  verifyCode,
  resetPassword,
  userInfo,
  logout,
  changePassword,
  updateUserInfo,
};
