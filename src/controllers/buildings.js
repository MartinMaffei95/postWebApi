const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY; // private key for jsonWebToken
const Building = require('../models/building');
var qs = require('qs');

//create a buildings
const createBuilding = (req, res) => {
  const { name, buildingIdentifier } = req.body;

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

  jwt.verify(req.token, SECRET_KEY, async (err, userData) => {
    if (err) {
      return res.status(501).json({
        message: 'TOKEN_ERROR',
        error: err,
      });
    }

    const building = new Building({
      name: name,
      buildingIdentifier: buildingIdentifier,
      admin: userData.user._id,
      tenants: userData.user._id,
      spaces: [],
    });
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
