const express = require('express');
const { search } = require('../controllers/search');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');

//get a space
router.get('/?', verifyToken, search);

module.exports = router;
