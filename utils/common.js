const { Mongoose } = require('mongoose');
const _ = require('lodash');
/**
 * Check Whether Object is Mongoose Model
 * @param object
 * @returns {boolean}
 */
const isMongooseModel = (object = {}) => {
  return object instanceof Mongoose.prototype.Model;
};

/**
 * Check Whether Object is Mongoose Documents
 * @param object
 * @returns {boolean}
 */
const isMongooseDocument = (object = {}) => {
  return object instanceof Mongoose.prototype.Document;
};

/**
 * Check Whether Object is Mongoose ObjectId
 * @param data
 * @returns {boolean}
 */
const isObjectId = (data = {}) => {
  return Mongoose.prototype.isValidObjectId(data);
};

/**
 * @param {Number} number
 * @returns {{suit: string, value: number}|{suit: string, value: *}}
 */
const getCard = (number) => {
  if (number >= 2 && number <= 14) {
    return { suit: 'CLUBS', value: number };
  }
  if (number >= 16 && number <= 28) {
    return { suit: 'DIAMONDS', value: number % 14 || 14 };
  }
  if (number >= 30 && number <= 42) {
    return { suit: 'HEARTS', value: number % 14 || 14 };
  }
  if (number >= 44 && number <= 56) {
    return { suit: 'SPADES', value: number % 14 || 14 };
  }
};

const getCardDeck = () => {
  const clubs = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const diamonds = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
  const hearts = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42];
  const spades = [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56];
  return clubs.concat(diamonds).concat(hearts).concat(spades);
};

/**
 * @param {String} string
 * @returns {string}
 */
const capitalizeFirstLetter = (string = '') => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * @param {Object} gameObj
 * @param {boolean} reverse
 * @returns {*|number|{ref: string, type}}
 */
const getNextTurn = (gameObj, reverse = false) => {
  const turnUser = gameObj.turn;
  let nextTurn = false;
  let fistActiveUser;
  let nextActiveUser;

  const participants = _.cloneDeep(gameObj.party.participants)
    .filter((participant) => participant.connected)
    .sort(function (participanta, participantab) {
      return participanta.connectedAt - participantab.connectedAt;
    });
  if (reverse) {
    _.forEachRight(participants, (participant) => {
      if (turnUser.toString() === participant.participant.toString()) {
        nextTurn = true;
      } else if (!nextTurn && participant.status === 'accepted' && !fistActiveUser) {
        fistActiveUser = participant.participant;
      } else if (nextTurn && participant.status === 'accepted' && !nextActiveUser) {
        nextActiveUser = participant.participant;
      }
    });
  } else {
    participants.forEach((participant) => {
      if (turnUser.toString() === participant.participant.toString()) {
        nextTurn = true;
      } else if (!nextTurn && participant.status === 'accepted' && !fistActiveUser) {
        fistActiveUser = participant.participant;
      } else if (nextTurn && participant.status === 'accepted' && !nextActiveUser) {
        nextActiveUser = participant.participant;
      }
    });
  }
  return nextActiveUser || fistActiveUser || gameObj.turn;
};

module.exports = {
  isMongooseModel,
  isMongooseDocument,
  isObjectId,
  getCard,
  getCardDeck,
  capitalizeFirstLetter,
  getNextTurn,
};
