const mongoose = require('mongoose');
const { mongodb } = require('./config.js');

const connection = mongoose
  .connect(
    `mongodb://${mongodb.host}/${mongodb.database}`
    // `mongodb+srv://${mongodb.user}:${mongodb.password}@${mongodb.host}/${mongodb.database}?retryWrites=true&w=majority`
  )
  .then((db) => {
    console.log(`Connected to MongoDB in:  ${mongodb.host}`);
  })
  .catch((err) => {
    console.log('DB ERROR: ' + err);
  });

module.exports = connection;
