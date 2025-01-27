const _ = require('lodash');
const { User } = require('../models');

const authSession = () => async (req, res, next) => {
  const userId = _.get(req.session, 'user.id');
  const role = _.get(req.session, 'user.role');
  if (!userId) {
    return res.render('login', {});
  }
  return User.findOne({ _id: userId, role })
    .then((user) => {
      if (user) {
        req.user = user;
        next();
      } else {
        return res.render('login', {});
      }
    })
    .catch((err) => {
      next(err);
    });
};

module.exports = authSession;
