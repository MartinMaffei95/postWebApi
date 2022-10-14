const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Building = require('./building');
const Space = require('./space');
const User = require('./user');

const notificationSchema = new Schema({
  message: { type: String, default: '' },
  response: { type: String, default: '' },
  from: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  to: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  building: { type: Schema.Types.ObjectId, required: true, ref: 'Building' },
  space: { type: Schema.Types.ObjectId, required: true, ref: 'Space' },
  viewed: { type: Boolean, default: false, required: true },
  date: {
    type: Number,
    default: Date.now,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
