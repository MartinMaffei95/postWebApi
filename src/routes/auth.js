const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth');

//SIGN UP
router.post('/login', login);

//SIGN IN
router.post('/register', register);

module.exports = router;
