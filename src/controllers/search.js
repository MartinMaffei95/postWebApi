const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Building = require('../models/building');
const { isValidObjectId } = require('mongoose');
// const User = require('../models/user');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken

// search
const search = async (req, res) => {
  const { username } = req.query;
  if (req.query.username) {
    User.find({
      username: { $regex: username, $options: 'i' },
    }).then((u) => {
      res.status(200).json({
        message: 'FIND_RESULTS',
        user: u,
      });
    });
  }
};

module.exports = {
  search,
};
