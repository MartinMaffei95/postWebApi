const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./user');
const Space = require('./space');
const Building = require('./building');

const bookingSchema = new Schema({
  date: { type: Number, required: true },
  time: { type: String }, // if the space acpet different times//  "MORNING" - AFTERNOON - NIGHT
  building: { type: Schema.Types.ObjectId, ref: 'Building' },
  space: { type: Schema.Types.ObjectId, ref: 'Space' },
  bookedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
