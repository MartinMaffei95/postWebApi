const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Building = require('./building');
const Booking = require('./booking');

const spaceSchema = new Schema({
  name: {
    type: String,
    validate: {
      validator: function (name) {
        return mongoose
          .model('Space')
          .findOne({ name: name })
          .then((user) => !user);
      },
      message: 'TAKEN_NAME',
    },
  },
  fromBuilding: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Building',
  },
  bookings: [{ type: Schema.Types.ObjectId, default: [], name: 'Booking' }],
  timeSlotsFormat: { type: String, default: false, required: true }, // Mañana, tarde, noche | dia
  timeSlotsTaked: {},
  needConfirmation: { type: Boolean, default: false, required: true },
  createdAt: {
    type: Number,
    default: Date.now,
  },
  updatedAt: {
    type: Number,
    default: Date.now,
  },
});

const Space = mongoose.model('Space', spaceSchema);
module.exports = Space;
