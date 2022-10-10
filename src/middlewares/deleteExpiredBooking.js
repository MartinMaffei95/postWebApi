const Booking = require('../models/booking');
const Space = require('../models/space');
const moment = require('moment');

const deleteExpiredBookings = async () => {
  let bookings = await Booking.find({});
  let arrOfBookings = [];

  for (let i = 0; i < bookings.length; i++) {
    if (moment(bookings[i].date).isBefore(moment())) {
      let spaces = await Space.findByIdAndUpdate(
        bookings[i].space,
        {
          $pull: { bookings: bookings[i]._id },
        },
        { returnOriginal: false }
      );
      bookings[i].remove();
    }
  }
  console.log(arrOfBookings);
};

exports.deleteExpiredBookings = deleteExpiredBookings;
