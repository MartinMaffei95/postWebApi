const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Building = require('./building');

const userSchema = new Schema(
  {
    username: {
      type: String,
      validate: {
        validator: function (username) {
          return mongoose
            .model('User')
            .findOne({ username: username })
            .then((user) => !user);
        },
        message: 'TAKEN_USERNAME',
      },
    },
    name: { type: String, required: false, default: '' },
    last_name: { type: String, required: false, default: '' },
    email: { type: String, required: false, default: '' },
    //This is for configure alerts and visualization of data
    profileConfig: {
      name: {
        visualization: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
      last_name: {
        visualization: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
      email: {
        visualization: {
          type: Boolean,
          required: true,
          default: false,
        },
        alerts: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    },

    password: {
      type: String,
      required: [true, 'PASSWORD is required'],
      select: false,
    },
    buildings: [{ type: Schema.Types.ObjectId, default: [], ref: 'Building' }],
    tenantRequests: [
      { type: Schema.Types.ObjectId, default: [], ref: 'Building' }, //recibe building Id for acept later
    ],
    createdAt: {
      type: Number,
      default: Date.now,
    },
    updatedAt: {
      type: Number,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
