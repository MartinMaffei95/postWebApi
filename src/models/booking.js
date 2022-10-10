const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./user');
const Space = require('./space');
const Building = require('./building');
const moment = require('moment');

const aceptedTimes = ['MORNING', 'AFTERNOON', 'NIGHT', 'ALL_DAY'];
const checkDate = (timeString) => {
  if (!aceptedTimes.includes(timeString)) {
    return false;
  }
  return true;
};

const bookingSchema = new Schema({
  date: { type: Number, required: true },
  time: {
    type: String,
    validate: {
      validator: checkDate,
      message: (time) => `${time} IS_INVALID_VALUE`,
    },
    required: true,
  }, // if the space acpet different times//
  building: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
  space: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
  bookedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reservationAccepted: { type: Boolean, default: false, required: true },
  createdAt: {
    type: Number,
    default: Date.now,
  },
  updatedAt: {
    type: Number,
    default: Date.now,
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
