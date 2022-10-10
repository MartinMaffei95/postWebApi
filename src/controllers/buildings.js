const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken
const Building = require('../models/building');
const Space = require('../models/space');
const { createSpace } = require('./space');
const { Types } = require('mongoose');
const User = require('../models/user');

//################################
// ## CREATE BUILDINGS  ##########
//################################
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
      Space.insertMany(arrOfSpaces, function (err, result) {
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

//################################
// ## GET ALL BUILDINGS ##########
//################################
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

//################################
// ## GET MY BUILDINGS  ##########
//################################
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
      .populate({
        path: 'spaces',
        populate: { path: 'bookings' },
      })
      .exec((err, building) => {
        return res.status(200).json({
          message: 'BUILDINGS_FOUND',
          building,
        });
      });
  });
};

//################################
// ## GET ONE BUILDING ###########
//################################
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
      // .populate('admin spaces tenants')
      // .populate({
      //   path: 'spaces',
      //   populate: { path: 'bookings' },
      // })
      .populate([
        { path: 'admin' },
        { path: 'spaces', populate: { path: 'bookings' } },
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

module.exports = {
  createBuilding,
  getBuilding,
  getAllBuildings,
  getMyBuildings,
};
