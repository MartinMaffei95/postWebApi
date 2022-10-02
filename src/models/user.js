const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { Build } = require('./building');

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
  buildings: { type: [Build], default: undefined },
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
