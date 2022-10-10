const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Space = require('./space');
const User = require('./user');

const buildingSchema = new Schema({
  name: {
    type: String,
    validate: {
      validator: function (name) {
        return mongoose
          .model('Building')
          .findOne({ name: name })
          .then((user) => !user);
      },
      message: 'TAKEN_NAME',
    },
  },
  buildingIdentifier: {
    type: Schema.Types.String,
    required: true,
    validate: {
      validator: function (uuid) {
        return mongoose
          .model('Building')
          .findOne({ buildingIdentifier: uuid })
          .then((user) => !user);
      },
      message: 'ID_ALREDY_EXIST',
    },
  }, // uuid
  spaces: [{ type: Schema.Types.ObjectId, default: undefined, ref: 'Space' }],
  admin: [
    {
      type: Schema.Types.ObjectId,
      default: [],
      ref: 'User',
    },
  ],
  tenants: [
    {
      type: Schema.Types.ObjectId,
      default: [],
      ref: 'User',
    },
  ],
  requestsSended: [
    {
      type: Schema.Types.ObjectId,
      default: [],
      ref: 'User',
    },
  ],
  createdAt: {
    type: Number,
    default: Date.now,
  },
  updatedAt: {
    type: Number,
    default: Date.now,
  },
});

const Building = mongoose.model('Building', buildingSchema);
module.exports = Building;
