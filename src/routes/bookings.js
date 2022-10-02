const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyID } = require('../middlewares/verifyID');

const { createABooking, getBooking } = require('../controllers/booking');

//get a Booking
router.get('/:id', verifyToken, getBooking);

//create a Booking
router.post('/', verifyToken, createABooking);

module.exports = router;
