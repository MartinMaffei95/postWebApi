const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyID } = require('../middlewares/verifyID');

const {
  createABooking,
  getBooking,
  getMyBookings,
  getAllBookings,
} = require('../controllers/booking');

//get my Bookings
router.get('/me', verifyToken, getMyBookings);

//get a Booking
router.get('/:id', verifyToken, getBooking);

//get a Booking
router.get('/?', verifyToken, getAllBookings);

//create a Booking
router.post('/', verifyToken, createABooking);

module.exports = router;
