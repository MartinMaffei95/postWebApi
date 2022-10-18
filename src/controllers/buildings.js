const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken
const Building = require('../models/building');
const Space = require('../models/space');
const Booking = require('../models/booking');
const { createSpace } = require('./space');
const { Types, isValidObjectId } = require('mongoose');
const User = require('../models/user');

//######################################
// ##  BUILDIGN REQUESTS ###############
//######################################

// ## CREATE BUILDINGS  ##########
const createBuilding = (req, res) => {
  const { name, buildingIdentifier } = req.body;

  const spaces = req.body.spaces;
  // const { space_name, timeSlotsFormat, needConfirmation } = req.body.spaces;

  // -- Verificate body
  if (!name) {
    return res.status(500).json({
      message: 'NAME_IS_REQUIRED',
    });
  }

  if (!buildingIdentifier) {
    return res.status(500).json({
      message: 'UUID_IS_REQUIRED',
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

    // ## CREATING A BUILDING
    const builidngId = Types.ObjectId();

    // -- if user decides create a space in same action on the building
    let arrOfSpaces = []; //arrayOfObjects
    let arrSpaceId = []; //Arra Of Ids

    if (req.body.spaces) {
      for (let i = 0; i < spaces.length; i++) {
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
          fromBuilding: builidngId,
          timeSlotsFormat: spaces[i].timeSlotsFormat,
          needConfirmation: spaces[i].needConfirmation,
          bookings: [],
          defaultValuesTimeSlot: defaultValuesTimeSlot,
        };
        arrSpaceId.push(spaceId);
        arrOfSpaces.push(space);
      }

      const building = new Building({
        _id: builidngId,
        name: name,
        buildingIdentifier: buildingIdentifier,
        admin: userData.user._id,
        tenants: userData.user._id,
        spaces: arrSpaceId,
      });

      // saving multiple spaces
      Space.insertMany(arrOfSpaces, async function (err, result) {
        if (err) {
          return res.status(501).json({
            message: 'ERROR_SAVING_SPACE',
            error: err?.errors,
          });
        } else {
          await User.findByIdAndUpdate(
            userData.user._id,
            { $push: { buildings: builidngId } },
            { returnOriginal: false }
          );
          building.save((err, result) => {
            if (err) {
              return res.status(501).json({
                message: 'ERROR_SAVING_BUILDING',
                error: err?.errors,
              });
            } else {
              return res.status(200).json({
                message: 'CREADO',
                data: building,
              });
            }
          });
        }
      });
    }
  });
};

// ## GET ALL BUILDINGS ##########
const getAllBuildings = (req, res) => {
  const { id } = req.params;
  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let building = await Building.find(id);

    if (!building) {
      return res.status(501).json({
        message: 'BUILDING_NOT_FOUND',
        building,
      });
    }

    if (building) {
      return res.status(200).json({
        message: 'BUILDINGS_FOUND',
        building,
      });
    }
  });
};

// ## GET MY BUILDINGS  ##########
const getMyBuildings = (req, res) => {
  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }
    const myId = userData.user._id;

    let building = Building.find({
      tenants: {
        $in: [myId],
      },
    })
      .populate([
        { path: 'admin' },
        { path: 'tenants' },
        { path: 'spaces', populate: { path: 'bookings' } },
      ])
      .exec((err, building) => {
        return res.status(200).json({
          message: 'BUILDINGS_FOUND',
          building,
        });
      });
  });
};

// ## GET ONE BUILDING  ##########
const getBuilding = (req, res) => {
  const { id } = req.params;

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let building = await Building.findById(id)

      .populate([
        { path: 'admin' },
        {
          path: 'spaces',
          populate: { path: 'bookings', populate: 'building bookedBy space' },
          populate: {
            path: 'standByBookings',
            populate: 'building bookedBy space',
          },
        },
        { path: 'tenants' },
      ])
      .exec((err, result) => {
        if (err) {
          return res.status(501).json({
            message: 'BUILDING_NOT_FOUND',
            building,
          });
        }
        console.log(result);
        return res.status(200).json({
          message: 'BUILDING_FOUND',
          building: result,
        });
      });
  });
};

//######################################
// ##  ADMIN REQUESTS ##################
//######################################

// transform a tenant to admin
const giveAdmin = (req, res) => {
  const { id } = req.params; //id from building
  const { newAdmin } = req.body;

  if (!newAdmin || !isValidObjectId(newAdmin)) {
    return res.status(501).json({
      message: 'ADMIN_ID_IS_INVALID',
      data: newAdmin,
    });
  }

  // verify the userId is on "tenants" Array from building.
  // if is true then push the userId on admins array from building

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    const userId = userData.user._id;
    let building = await Building.findById(id);

    //verify the user who makes the req is an admin
    if (!building.admin.includes(userId)) {
      return res.status(501).json({
        message: 'USER_NOT_HAVE_PERMISSIONS',
      });
    }

    // verify the user is a tenant
    if (!building?.tenants?.includes(newAdmin)) {
      return res.status(501).json({
        message: 'USER_IS_NOT_A_TENANT',
        building,
      });
    }
    //verify the user is not a admin yet
    if (building?.admin?.includes(newAdmin)) {
      return res.status(501).json({
        message: 'USER_IS_ALREDY_ADMIN',
      });
    }
    await building.update(
      { $push: { admin: newAdmin } },
      { returnOriginal: false }
    );
    return res.status(200).json({
      message: 'USER_IS_ADMIN_NOW',
      building,
    });
  });
};

// remove admin  from a user
const removeAdmin = (req, res) => {
  const { id } = req.params; //id from building
  const { adminId } = req.body;

  if (!adminId || !isValidObjectId(adminId)) {
    return res.status(501).json({
      message: 'ADMIN_ID_IS_INVALID',
      data: adminId,
    });
  }

  // verify the userId is on "tenants" Array from building.
  // if is true then push the userId on admins array from building

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    const userId = userData.user._id;
    let building = await Building.findById(id);

    //verify the user who makes the req is an admin
    if (!building.admin.includes(userId)) {
      return res.status(501).json({
        message: 'USER_NOT_HAVE_PERMISSIONS',
      });
    }

    //verify the user is admin
    if (!building.admin.includes(adminId)) {
      return res.status(501).json({
        message: 'USER_IS_NOT_A_ADMIN',
        admins: building.admin,
      });
    }
    await building.update(
      { $pull: { admin: adminId } },
      { returnOriginal: false }
    );
    building = await Building.findById(id);
    //if there are no admins left we select one at random among the tenants. Exept the user who request
    if (building.admin.length <= 0) {
      let usersWithOutDeleted = building?.tenants?.filter(
        (userFromBuilding) => !userFromBuilding._id.equals(userId)
      );
      let tenatsOnBuilding = usersWithOutDeleted.length;
      let randomTenantIndex = Math.floor(Math.random() * tenatsOnBuilding);
      let randomTenant = usersWithOutDeleted[randomTenantIndex];
      await building.update(
        { $push: { admin: randomTenant } },
        { returnOriginal: false }
      );
    }
    return res.status(200).json({
      message: 'ADMIN_AS_DELETED',
      building,
    });
  });
};

module.exports = {
  createBuilding,
  getBuilding,
  getAllBuildings,
  getMyBuildings,
  giveAdmin,
  removeAdmin,
};
