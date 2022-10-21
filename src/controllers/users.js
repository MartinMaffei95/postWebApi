const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken
const Space = require('../models/space');
const Building = require('../models/building');
const User = require('../models/user');
const Booking = require('../models/booking');
const { isValidObjectId } = require('mongoose');
const { isValidEmail } = require('../utils/isvalidEmail');
const bcrypt = require('bcrypt');
const Notification = require('../models/notification');

//######################################
// ##  USER REQUESTS ################### -- Create & register is on controllers/auth.js file
//######################################

// Get a user
const getUser = (req, res) => {
  const { id } = req.params;

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let user = await User.findById(id).populate([
      { path: 'tenantRequests' },
      { path: 'buildings', populate: 'admin spaces' },
    ]);

    if (!user) {
      return res.status(501).json({
        message: 'SPACE_NOT_FOUND',
        user,
      });
    }

    if (user) {
      return res.status(200).json({
        message: 'USER_FOUND',
        user,
      });
    }
  });
};

//Edit a user
const editUser = (req, res) => {
  const { id } = req.params;
  const { username, name, last_name, email, password, profileConfig } =
    req.body;

  let updateObject = {};
  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    if (password) {
      if (password.length >= 12) {
        return res.status(401).json({
          message: 'IS_TO_LONG',
          password,
        });
      }
      bcrypt.hash(req.body.password, 10, async (err, hash) => {
        if (err) {
          // console.log('BCRYPT ERROR:', 'PASS send on BODY', req.body.password, err);
          return res.status(400).send({
            message: 'PASS_ERROR',
            error: err,
          });
        }
        updateObject = { ...updateObject, password: hash };
      });
    }

    // Create a edited user object
    if (username && username !== userData.user.username) {
      let userFinded = await User.findOne({ username: username });
      console.log(userFinded);
      if (userFinded) {
        return res.status(500).json({
          message: 'USERNAME_IS_ALREDY_TAKEN',
          username,
        });
      }
      if (username.length >= 12) {
        return res.status(500).json({
          message: 'IS_TO_LONG',
          username,
        });
      }
      updateObject = { ...updateObject, username: username };
    }
    if (name && name !== userData.user.name) {
      if (name.length >= 12) {
        return res.status(500).json({
          message: 'IS_TO_LONG',
          name,
        });
      }
      updateObject = { ...updateObject, name: name };
    }
    if (last_name && last_name !== userData.user.last_name) {
      if (last_name.length >= 12) {
        return res.status(500).json({
          message: 'IS_TO_LONG',
          last_name,
        });
      }
      updateObject = { ...updateObject, last_name: last_name };
    }
    if (email && email !== userData.user.email) {
      if (!isValidEmail(email)) {
        return res.status(500).json({
          message: 'INVALID_EMAIL',
          email,
        });
      }
      updateObject = { ...updateObject, email: email };
    }
    if (profileConfig) {
      updateObject = { ...updateObject, profileConfig: profileConfig };
    }

    // Updating
    let updateProfile = await User.findByIdAndUpdate(id, updateObject, {
      returnOriginal: false,
    });
    if (updateProfile !== null) {
      jwt.sign({ user: updateProfile }, SECRET_KEY, (err, token) => {
        res.status(200).send({
          message: 'PROFILE_MODIFIED',
          user: updateProfile,
          token: token,
        });
      });
    } else {
      res.status(404).json({
        message: 'PROFILE_ERROR',
      });
    }
  });
};

//######################################
// ##  TENANTS REQUESTS ################
//######################################

// send request for add tenant on building
const addTenantRequest = (req, res) => {
  const { id } = req.params; // userId
  const { buildingId } = req.body;

  if (!buildingId || !isValidObjectId(buildingId)) {
    return res.status(501).json({
      message: 'BUILDING_ID_IS_INVALID',
    });
  }

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let user = await User.findById(id);
    if (!user) {
      return res.status(501).json({
        message: 'USER_NOT_FOUND',
      });
    }
    if (user.buildings.includes(buildingId)) {
      return res.status(501).json({
        message: 'USER_IS_ALREDY_IN_THIS_BUILDING',
      });
    }
    if (user.tenantRequests.includes(buildingId)) {
      return res.status(501).json({
        message: 'INVITATION_IS_ALREDY_SENDED',
      });
    }
    let building = await Building.findById(buildingId);
    if (!building) {
      return res.status(501).json({
        message: 'BUILDING_NOT_EXIST',
      });
    }

    //Now: push the builiding id on 'tenantRequests' array.
    user.update(
      {
        $push: {
          tenantRequests: buildingId,
        },
      },
      async (err, userUpdated) => {
        if (err) {
          return res.status(501).json({
            message: 'SERVER_ARROR_ON_UPDATE',
            error: err,
          });
        }
        // pushing id of user in buildings requests
        await building.update({
          $push: {
            requestsSended: id,
          },
        });
        return res.status(200).json({
          message: 'REQUEST_SUCCESS',
        });
      }
    );
  });
};

// Cancel a request
const cancelTenantRequest = (req, res) => {
  const { id } = req.params; // userId
  const { buildingId } = req.body;

  if (!buildingId || !isValidObjectId(buildingId)) {
    return res.status(501).json({
      message: 'BUILDING_ID_IS_INVALID',
    });
  }

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let user = await User.findById(id);
    if (!user) {
      return res.status(501).json({
        message: 'USER_NOT_FOUND',
      });
    }
    // if (user.buildings.includes(buildingId)) {
    //   return res.status(501).json({
    //     message: 'USER_IS_ALREDY_IN_THIS_BUILDING',
    //   });
    // }
    if (!user.tenantRequests.includes(buildingId)) {
      return res.status(501).json({
        message: 'INVITATION_IS_NOT_SENDED',
      });
    }
    let building = await Building.findById(buildingId);
    if (!building) {
      return res.status(501).json({
        message: 'BUILDING_NOT_EXIST',
      });
    }

    //Now: push the builiding id on 'tenantRequests' array.
    user.update(
      {
        $pull: {
          tenantRequests: buildingId,
        },
      },
      async (err, userUpdated) => {
        if (err) {
          return res.status(501).json({
            message: 'SERVER_ARROR_ON_UPDATE',
            error: err,
          });
        }
        // pushing id of user in buildings requests
        await building.update({
          $pull: {
            requestsSended: id,
          },
        });
        return res.status(200).json({
          message: 'REQUEST_SUCCESS',
        });
      }
    );
  });
};

// Acepting a request
const aceptTenantRequest = (req, res) => {
  const { id } = req.params; // buildingId

  //compare Id of url with id if "tenantRequests" array on userDate.
  // if exist add building Id on "buildings" array of user and add user Id on "tentants" array of building
  // remember delete bulding Id of "tenantRequests" on user

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let user = await User.findById(userData.user._id);
    if (!user) {
      return res.status(501).json({
        message: 'USER_NOT_FOUND',
      });
    }

    if (!user.tenantRequests.includes(id)) {
      return res.status(501).json({
        message: 'REQUEST_NOT_EXIST',
      });
    }
    if (user.buildings.includes(id)) {
      return res.status(501).json({
        message: 'USER_IS_ALREDY_IN_THIS_BUILDING',
      });
    }

    let buildingToEdit = await Building.findById(id);
    if (!buildingToEdit) {
      return res.status(501).json({
        message: 'BUILDING_NOT_EXIST',
      });
    }
    console.log(buildingToEdit);

    user.update(
      {
        $pull: {
          tenantRequests: id,
        },
        $push: {
          buildings: id,
        },
      },
      async (err, userUpdated) => {
        if (err) {
          return res.status(501).json({
            message: 'SERVER_ARROR_ON_UPDATE',
            error: err,
          });
        }
        await buildingToEdit.update({
          $pull: {
            requestsSended: user._id,
          },
          $push: {
            tenants: user._id,
          },
        });
        return res.status(200).json({
          message: 'REQUEST_SUCCESS',
          user,
        });
      }
    );
  });
};

// remove tenant from building
const removeTenant = (req, res) => {
  const { id } = req.params; // userId
  const { buildingId } = req.body;

  if (!buildingId || !isValidObjectId(buildingId)) {
    return res.status(501).json({
      message: 'BUILDING_ID_IS_INVALID',
    });
  }

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }
    let building = await Building.findById(buildingId);

    if (
      !building.admin.includes(userData.user._id) &&
      id !== userData.user._id
    ) {
      return res.status(501).json({
        message: 'USER_NOT_HAVE_PERMISSIONS',
      });
    }

    let user = await User.findById(id);
    if (!user) {
      return res.status(501).json({
        message: 'USER_NOT_FOUND',
      });
    }
    if (!user.buildings.includes(buildingId)) {
      return res.status(501).json({
        message: 'USER_IS_NOT_IN_BUILDING',
      });
    }

    if (!building) {
      return res.status(501).json({
        message: 'BUILDING_NOT_EXIST',
      });
    }

    if (building.admin.includes(id)) {
      await building.update({
        $pull: {
          tenants: id,
          admin: id,
        },
      });
      await user.update({
        $pull: {
          buildings: buildingId,
        },
      });
      let bookings = await Booking.find({});
      building = await Building.findById(buildingId);
      // For elimination of tenants
      if (building?.tenants?.length <= 0) {
        await Space.deleteMany({ fromBuilding: buildingId });
        await Booking.deleteMany({ building: buildingId });
        await Building.deleteOne({ _id: buildingId });
      }
      if (bookings) {
        await Booking.deleteMany({ bookedBy: id, building: buildingId });
      }
      return res.status(200).json({
        message: 'REMOVED_USER_FROM_BUILDING',
      });
    }

    await building.update({
      $pull: {
        tenants: id,
      },
    });
    await user.update({
      $pull: {
        buildings: buildingId,
      },
    });
    let bookings = await Booking.find({});
    // For elimination of tenants
    if (building.tenants.length <= 0) {
      await Space.deleteMany({ fromBuilding: buildingId });
      await Booking.deleteMany({ building: buildingId });
      await Building.deleteOne({ _id: buildingId });
    }
    if (bookings) {
      await Booking.deleteMany({ bookedBy: id, building: buildingId });
    }
    return res.status(200).json({
      message: 'REMOVED_USER_FROM_BUILDING',
    });
  });
};

//######################################
// ##  NOTIFICATION REQUESTS ###########
//######################################

const getMyNotifications = (req, res) => {
  const { id } = req.params; // user id
  const { page } = req.query;

  const { spaceId } = req.query;
  if (!page) {
    return res.status(500).json({
      message: 'NEED_PAGE_NUMBER',
      reservation,
    });
  }

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }
    const paginationOpt = {
      page: page,
      limit: 10,
      populate: 'building space from booking',
    };
    let notifications = await Notification.paginate(
      {},
      paginationOpt,
      (err, result) => {
        return res.status(200).json({
          message: 'NOTIFICATIONS_FIND',
          notifications: result,
        });
      }
    );

    //   let notifications = await Notification.find({
    //     to: id,
    //   }).populate('building space from booking');
  });
};

const setViewedNotification = (req, res) => {
  const { id } = req.params; // user id
  const { notifications_id } = req.body;
  console.log(req.body);
  if (!notifications_id || notifications_id?.length <= 0) {
    return res.status(500).json({
      message: 'REQUEST_BODY_IS_EMPTY',
      notifications_id,
    });
  }
  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(500).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    for (let i = 0; i < notifications_id.length; i++) {
      const notification = notifications_id[i];
      Notification.findByIdAndUpdate(
        notification._id,
        { viewed: true },
        { returnOriginal: false },
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: 'ERROR_IN_UPDATE_NOTIFICATIONS',
              error: err,
            });
          }
        }
      );
    }
    return res.status(200).json({
      message: 'NOTIFICATIONS_UPDATED',
    });
  });
};

module.exports = {
  getUser,
  addTenantRequest,
  aceptTenantRequest,
  cancelTenantRequest,
  removeTenant,
  editUser,
  getMyNotifications,
  setViewedNotification,
};
