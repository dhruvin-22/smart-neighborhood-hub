const httpStatus = require('http-status');
const _ = require('lodash');
const { User, Party, Music, GameHistory } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const user = await User.create(userBody);
  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Aggregate Friends
 * @param {Object} query - Mongo Aggregate
 * @param {Object} options - Aggregate options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const aggregateUsers = async (query, options) => {
  const users = await User.aggregatePaginate(User.aggregate(query), options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

/**
 * @param userId
 * @param party
 * @param isAdd
 * @param partyLeaveReason
 * @returns {Promise<void>}
 */
const updateUserParty = async (userId, party, isAdd, partyLeaveReason) => {
  if (isAdd) {
    return updateUserById(userId, { party, onParty: true, partyLeaveReason, genre: undefined });
  }
  return updateUserById(userId, { party: undefined, onParty: false, partyLeaveReason, genre: undefined });
};

/**
 * @param user
 * @returns {Promise<{user: *}>}
 */
const getUserCurrentData = async (user) => {
  const response = { user: user.toJSON() };
  if (user && user.party) {
    const partyObj = await Party.findOne({ _id: user.party, active: true });
    if (partyObj) {
      const values = await Promise.all([
        GameHistory.findOne({ party: user.party, active: true }, { cardOutPuts: 0, diceOutPuts: 0 }).populate('game'),
        Music.findOne({ party: user.party, active: true }),
      ]);
      const [game, music] = values;
      if (partyObj) {
        response.party = partyObj.toJSON();
        if (game) {
          response.game = game.toJSON();
          response.game.type = _.get(game, 'game.type');
        }
        if (music) {
          response.music = music.toJSON();
        }
      }
    }
  }
  return response;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  updateUserParty,
  aggregateUsers,
  getUserCurrentData,
};
