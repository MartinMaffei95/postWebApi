const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken

// Register
const register = (req, res) => {
  //encripting the password with BCRYPT and create USER
  if (req?.body?.password?.length <= 4 || req?.body?.password?.length > 12) {
    return res.status(500).send({
      message: 'INVALID_PASSWORD',
      errors:
        'password must be at least 4 characters and at least 12 characters',
    });
  }
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      // console.log('BCRYPT ERROR:', 'PASS send on BODY', req.body.password, err);
      return res.status(400).send({
        message: 'BAD_REQUEST',
        error: err,
      });
    }
    const user = new User({
      username: req.body.username,
      password: hash,
    });

    user.save((err, result) => {
      if (err) {
        res.status(500).send({
          message: 'ERROR_LOGIN',
          errors: err.errors,
        });
      } else {
        res.status(201).send({
          message: 'USER_CREATED',
          user: result,
        });
        console.log(result);
      }
    });
  });
};

// Login
const login = (req, res) => {
  User.findOne({ username: req.body.username }, (err, result) => {
    if (err) {
      res.send('Error en el login ' + err);
    } else {
      if (result) {
        if (
          req.body.password &&
          bcrypt.compareSync(req.body.password, result.password)
        ) {
          //User logged!
          //now
          //Creating Token with jsw
          jwt.sign({ user: result }, SECRET_KEY, (err, token) => {
            res.status(200).send({
              message: 'LOGIN_SUCCESS',
              user: result,
              token: token,
            });
          });
        } else {
          res.status(400).send({
            message: 'IVALID_PASSWORD',
            error: err,
          });
        }
      } else {
        res.status(400).send({
          message: 'IVALID_USER',
          error: err,
        });
      }
    }
  });
};

module.exports = {
  login,
  register,
};
