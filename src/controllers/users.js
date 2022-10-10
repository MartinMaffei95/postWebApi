const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken
const Space = require('../models/space');
const Building = require('../models/building');
const User = require('../models/user');
const { isValidObjectId } = require('mongoose');

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

    let user = await User.findById(id).populate('tenantRequests');
    if (!user) {
      return res.status(501).json({
        message: 'SPACE_NOT_FOUND',
        user,
      });
    }

    if (user) {
      return res.status(200).json({
        message: 'SPACE_FOUND',
        user,
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

module.exports = {
  getUser,
  addTenantRequest,
  aceptTenantRequest,
  cancelTenantRequest,
};
