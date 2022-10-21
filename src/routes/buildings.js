const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyID } = require('../middlewares/verifyID.js');

const {
  createBuilding,
  getBuilding,
  getAllBuildings,
  getMyBuildings,
  giveAdmin,
  removeAdmin,
  addOnAlertGroup,
  deleteOnAlertGroup,
} = require('../controllers/buildings');

//create a Building
router.post('/', verifyToken, createBuilding);

//getting all buildings
router.get('/all', verifyToken, getAllBuildings);

//Admins requests
router.post('/admin/:id', verifyToken, verifyID, giveAdmin);
//Admins requests
router.delete('/admin/:id', verifyToken, verifyID, removeAdmin);

//getting my buildings
router.get('/', verifyToken, getMyBuildings);

//getting a specific building
router.get('/:id', verifyToken, verifyID, getBuilding);

// ALERTS ON
router.post('/:id/alert', verifyToken, verifyID, addOnAlertGroup);

// ALERTS OFF
router.delete('/:id/alert', verifyToken, verifyID, deleteOnAlertGroup);

module.exports = router;
