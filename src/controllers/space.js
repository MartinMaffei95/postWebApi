const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken
const Space = require('../models/space');
const Building = require('../models/building');
const Booking = require('../models/booking');
const User = require('../models/user');
const Notification = require('../models/notification');
const { isValidObjectId, Types } = require('mongoose');
const emailer = require('../config/emailer');

//## to do:
// the spaces represents zooms in building (i was to be: zoom, pool, every place u want a share)

//get a space
// get a specific building
const getSpace = (req, res) => {
  const { id } = req.params;

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let space = await Space.findById(id).populate('fromBuilding');
    if (!space) {
      return res.status(501).json({
        message: 'SPACE_NOT_FOUND',
        space,
      });
    }

    if (space) {
      return res.status(200).json({
        message: 'SPACE_FOUND',
        space,
      });
    }
  });
};

//create a space for building
const createSpace = (req, res) => {
  const { fromBuilding } = req.body;

  const spaces = req.body.spaces;

  if (!fromBuilding) {
    return res.status(500).json({
      message: 'BUILDING_ID_IS_REQUIRED',
    });
  }

  if (!isValidObjectId(fromBuilding)) {
    return res.status(500).json({
      message: 'BUILDING_ID_IS_INVALID',
    });
  }

  // ## JWT

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let buildingToEdit = await Building.findById(fromBuilding).populate(
      'spaces'
    );
    if (!buildingToEdit) {
      return res.status(501).json({
        message: 'BUILDING_NOT_FOUND',
      });
    }

    // -- if user decides create a space in same action on the building
    let arrOfSpaces = []; //arrayOfObjects
    let arrSpaceId = []; //Array Of Ids

    if (req.body.spaces) {
      for (let i = 0; i < spaces.length; i++) {
        let defaultValuesTimeSlot; // ['MORNING', 'AFTERNOON', 'NIGHT']; ['ALL_DAY'];

        if (!spaces[i].space_name) {
          return res.status(500).json({
            message: 'NAME_IS_REQUIRED',
          });
        }
        if (arrOfSpaces?.find((sp) => sp.name === spaces[i].space_name)) {
          return res.status(500).json({
            message: 'NAMES_CANNOT_BE_REPEATED',
            A: spaces[i].space_name,
          });
        }

        //verify name is alredy exists
        if (
          buildingToEdit.spaces.find((s) => s.name === spaces[i].space_name)
        ) {
          return res.status(501).json({
            message: 'NAME_ALREDY_TAKEN',
          });
        }

        if (!spaces[i].timeSlotsFormat) {
          return res.status(500).json({
            message: 'TIME_CONFIG_IS_REQUIRED',
          });
        }

        if (spaces[i].timeSlotsFormat === 'BY_TIME_SLOT') {
          defaultValuesTimeSlot = ['MORNING', 'AFTERNOON', 'NIGHT'];
        } else if (spaces[i].timeSlotsFormat === 'PER_DAY') {
          defaultValuesTimeSlot = ['ALL_DAY'];
        } else {
          return res.status(500).json({
            message: 'INVALID_TIME_CONFIG',
            error: `Only accept "BY_TIME_SLOT" or "ALL_DAY. Your value ${spaces[i].timeSlotsFormat} is not valid`,
          });
        }

        if (
          (spaces[i].needConfirmation !== Boolean ||
            spaces[i].needConfirmation) === null ||
          spaces[i].needConfirmation === undefined
        ) {
          return res.status(500).json({
            message: 'PERMISSION_CONFIG_IS_REQUIRED',
          });
        }

        // ## CREATING A SPACE IN SAME ACTION

        const spaceId = Types.ObjectId();
        const space = {
          _id: spaceId,
          name: spaces[i].space_name,
          fromBuilding: fromBuilding,
          timeSlotsFormat: spaces[i].timeSlotsFormat,
          needConfirmation: spaces[i].needConfirmation,
          bookings: [],
          defaultValuesTimeSlot: defaultValuesTimeSlot,
        };
        arrSpaceId.push(spaceId);
        arrOfSpaces.push(space);
      }

      // saving multiple spaces

      Space.insertMany(arrOfSpaces, async function (err, result) {
        if (err) {
          return res.status(501).json({
            message: 'ERROR_SAVING_SPACE',
            error: err?.errors,
          });
        } else {
          //In this step add ids of spacec in "building"

          let building = await Building.findByIdAndUpdate(
            fromBuilding,
            {
              $push: { spaces: arrSpaceId },
            },
            { returnOriginal: false }
          );
          if (!building) {
            return res.status(501).json({
              message: 'ERROR_SAVING_BUILDING',
            });
          } else {
            return res.status(200).json({
              message: 'CREADO',
              data: building,
            });
          }
        }
      });
    }
  });
};

//########################################################
//##### RESPONSE BOOKINGS #####- only admin can response##
//########################################################
const aceptBooking = (req, res) => {
  const { id } = req.params; // -- Space id --
  const { booking_id } = req.body; // -- Booking id --

  if (!booking_id || !isValidObjectId(booking_id)) {
    return res.status(501).json({
      message: 'BOOKING_ID_INVALID',
    });
  }

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let space = await Space.findById(id);
    //verify booking is wait for authorization
    if (!space.standByBookings.includes(booking_id)) {
      return res.status(501).json({
        message: 'BOOKING_NOT_FOUND',
      });
    }

    // Verify the user who acept is a admin
    let building = await Building.findById(space.fromBuilding);
    if (!building.admin.includes(userData.user._id)) {
      return res.status(501).json({
        message: 'USER_NOT_HAVE_PERMISSIONS',
      });
    }
    let aceptedBooking = await Booking.findById(booking_id).populate(
      'bookedBy'
    );
    // if accept: remove id from "standByBookings" and push on "bookings". Send notification to user who create a booking
    //  await Booking.find({})
    space = await Space.findById(id).populate('bookings');
    if (
      space.bookings.find(
        (booking) =>
          booking.date === aceptedBooking.date &&
          booking.time === aceptedBooking.time
      )
    ) {
      return res.status(501).json({
        message: 'HAVE_ANOTHER_RESERVATION',
      });
    }
    // => Create a notification
    Space.findByIdAndUpdate(
      id,
      {
        $push: {
          bookings: booking_id,
        },
        $pull: {
          standByBookings: booking_id,
        },
      },
      { returnOriginal: false },
      async (err, editedSpace) => {
        if (err) {
          return res.status(500).json({
            err,
          });
        }

        // Create and sending notification to user
        const notification_Id = Types.ObjectId();
        const notification = new Notification({
          _id: notification_Id,
          response: 'BOOKING_ACEPTED',
          from: userData?.user?._id,
          to: aceptedBooking?.bookedBy?._id,
          building: aceptedBooking?.building,
          space: aceptedBooking?.space,
          booking: aceptedBooking,
          viewed: false,
        });
        await notification.save();
        let user = await User.findByIdAndUpdate(aceptedBooking?.bookedBy?._id, {
          $push: {
            notifications: notification_Id,
          },
        });
        //change state of booking to acepted = true
        await Booking.findByIdAndUpdate(booking_id, {
          status: 'ACEPTED',
        });
        let booking = await Booking.findById(booking_id).populate(
          'building space bookedBy'
        );
        if (
          booking?.bookedBy?.profileConfig?.email?.alerts === true &&
          building?.tenantsToAlert?.includes(userData?.user._id)
        ) {
          if (booking?.bookedBy?.email) emailer.sendMail(booking, true);
        }
        return res.status(201).json({
          editedSpace,
        });
      }
    );
  });
};

const denyBooking = (req, res) => {
  const { id } = req.params; // -- Space id --
  const { booking_id } = req.body; // -- Booking id --

  if (!booking_id || !isValidObjectId(booking_id)) {
    return res.status(501).json({
      message: 'BOOKING_ID_INVALID',
    });
  }

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let space = await Space.findById(id);
    //verify booking is wait for authorization
    if (!space?.standByBookings?.includes(booking_id)) {
      return res.status(501).json({
        message: 'BOOKING_NOT_FOUND',
      });
    }
    // Verify the user who acept is a admin
    let building = await Building.findById(space.fromBuilding);
    if (!building?.admin?.includes(userData.user._id)) {
      return res.status(501).json({
        message: 'USER_NOT_HAVE_PERMISSIONS',
      });
    }
    let bookingDeny = await Booking.findById(booking_id).populate('bookedBy');
    // if accept: remove id from "standByBookings" and push on "bookings". Send notification to user who create a booking

    Space.findByIdAndUpdate(
      id,
      {
        $pull: {
          standByBookings: booking_id,
        },
      },
      { returnOriginal: false },
      async (err, editedSpace) => {
        if (err) {
          return res.status(500).json({
            err,
          });
        }
        // Create and sending notification to user
        const notification_Id = Types.ObjectId();
        const notification = new Notification({
          _id: notification_Id,
          response: 'BOOKING_DENIED',
          from: userData?.user?._id,
          to: bookingDeny?.bookedBy?._id,
          building: bookingDeny?.building,
          space: bookingDeny?.space,
          booking: bookingDeny,
          viewed: false,
        });
        await notification.save();
        let user = await User.findByIdAndUpdate(bookingDeny?.bookedBy?._id, {
          $push: {
            notifications: notification_Id,
          },
        });
        //change state of booking to deny
        await Booking.findByIdAndUpdate(booking_id, {
          status: 'DENY',
        });
        let booking = await Booking.findById(booking_id).populate(
          'building space bookedBy'
        );
        if (
          booking?.bookedBy?.profileConfig?.email?.alerts === true &&
          building?.tenantsToAlert?.includes(userData?.user._id)
        ) {
          if (booking?.bookedBy?.email) emailer.sendMail(booking, false);
        }
        return res.status(201).json({
          editedSpace,
        });
      }
    );
  });
};

module.exports = {
  createSpace,
  getSpace,
  aceptBooking,
  denyBooking,
};
