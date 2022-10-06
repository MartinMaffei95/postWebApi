const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Building = require('./building');

const userSchema = new Schema({
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
  name: {},
  password: { type: String, required: [true, 'PASSWORD is required'] },
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
});

const User = mongoose.model('User', userSchema);
module.exports = User;
