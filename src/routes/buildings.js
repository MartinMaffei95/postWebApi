const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyID } = require('../middlewares/verifyID');

const {
  createBuilding,
  addTenant,
  getBuilding,
  getAllBuildings,
  getMyBuildings,
} = require('../controllers/buildings');

//create a Building
router.post('/', verifyToken, createBuilding);

//add tenant on building
router.post('/:id', verifyToken, verifyID, addTenant);

//getting all buildings
router.get('/all', verifyToken, getAllBuildings);

//getting my buildings
router.get('/', verifyToken, getMyBuildings);

//getting a specific building
router.get('/:id', verifyToken, verifyID, getBuilding);

module.exports = router;
