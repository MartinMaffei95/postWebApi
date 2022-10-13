const express = require('express');
const {
  createSpace,
  getSpace,
  aceptBooking,
  denyBooking,
} = require('../controllers/space');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyID } = require('../middlewares/verifyID');
//get a space
router.get('/:id', verifyToken, verifyID, getSpace);

//create a Space
router.post('/', verifyToken, createSpace);

//acept a Booking
router.post('/:id/acept', verifyToken, verifyID, aceptBooking);

//deny a Booking
router.post('/:id/deny', verifyToken, verifyID, denyBooking);

module.exports = router;
