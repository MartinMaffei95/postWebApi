const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken
const Building = require('../models/building');
const Space = require('../models/space');
const { createSpace } = require('./space');
const { Types } = require('mongoose');

//################################
// ## CREATE BUILDINGS  ##########
//################################

const createBuilding = (req, res) => {
  const { name, buildingIdentifier } = req.body;

  const { space_name, timeSlotsFormat, needConfirmation } = req.body.spaces;

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
    const spaceId = Types.ObjectId();

    const building = new Building({
      _id: builidngId,
      name: name,
      buildingIdentifier: buildingIdentifier,
      admin: userData.user._id,
      tenants: userData.user._id,
      spaces: [spaceId],
    });

    // -- if user decides create a space in same action on the building
    if (req.body.spaces) {
      if (!space_name) {
        return res.status(500).json({
          message: 'NAME_IS_REQUIRED',
        });
      }

      if (!timeSlotsFormat) {
        return res.status(500).json({
          message: 'TIME_CONFIG_IS_REQUIRED',
        });
      }

      if (
        (needConfirmation !== Boolean || needConfirmation) === null ||
        needConfirmation === undefined
      ) {
        return res.status(500).json({
          message: 'PERMISSION_CONFIG_IS_REQUIRED',
        });
      }

      // ## CREATING A SPACE IN SAME ACTION
      const space = new Space({
        _id: spaceId,
        name: space_name,
        fromBuilding: builidngId,
        timeSlotsFormat,
        needConfirmation,
        bookings: [],
      });

      space.save(async (err, result) => {
        if (err) {
          return res.status(501).json({
            message: 'ERROR_SAVING_SPACE',
            error: err?.errors,
          });
        } else {
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

//add a inquiline on building
const addTenant = (req, res) => {
  const { id } = req.params;

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }
    let building = await Building.findById(id);
    if (building?.tenants?.includes(userData?.user?._id)) {
      return res.status(501).json({
        message: 'USER_ALREDY_EXISTS',
      });
    }

    building = await Building.findByIdAndUpdate(
      id,
      {
        $push: { tenants: userData?.user?._id },
      },
      { returnOriginal: false }
    );
    if (building) {
      return res.status(501).json({
        building,
      });
    }
  });
};

// get all
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

// get a specific building
const getBuilding = (req, res) => {
  const { id } = req.params;

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    let building = await Building.findById(id);
    if (!building) {
      return res.status(501).json({
        message: 'BUILDING_NOT_FOUND',
        building,
      });
    }

    if (building) {
      return res.status(200).json({
        message: 'BUILDING_FOUND',
        building,
      });
    }
  });
};

module.exports = {
  createBuilding,
  addTenant,
  getBuilding,
  getAllBuildings,
};
