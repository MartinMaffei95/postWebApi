const express = require('express');
const logger = require('morgan');
require('dotenv').config();
const app = express();
app.use(logger('dev'));
const cron = require('node-cron');
const cors = require('cors');

const moment = require('moment');

const Building = require('./models/building');
const User = require('./models/user');
// ROUTES
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const buildingRoutes = require('./routes/buildings');
const spaceRoutes = require('./routes/spaces');
const bookingRoutes = require('./routes/bookings');
const searchRoutes = require('./routes/search');
const Space = require('./models/space');
const { deleteExpiredBookings } = require('./middlewares/deleteExpiredBooking');
const { Types } = require('mongoose');

//############################
// ## CONNECTING DB ##########
//############################

require('./connection');

//############################
// ## SERVER CONFIG ##########
//############################
app.use(
  cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.set('PORT', process.env.PORT || 4000);
app.use(express.json());

//############################
// ## CONFIG ROUTES ##########
//############################

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/buildings', buildingRoutes);
app.use('/spaces', spaceRoutes);
app.use('/bookings', bookingRoutes);
app.use('/search', searchRoutes);

//#####################################
// ## CLEAN EXPIRED BOOKINGS ##########
//#####################################

cron.schedule('* */6 * * *', function () {
  deleteExpiredBookings();
  console.log(
    `Cleaning expired Bookings from DB. Next cleaning in 6h ${moment()}`
  );
});

// console.log(moment(1665198624069).add(30, 's'));
app.listen(app.get('PORT'), () => {
  console.log(`server listening on port ${app.get('PORT')}`);
});
