const express = require('express');
const { createSpace, getSpace } = require('../controllers/space');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');

//get a space
router.get('/:id', verifyToken, getSpace);

//create a Space
router.post('/', verifyToken, createSpace);

module.exports = router;
