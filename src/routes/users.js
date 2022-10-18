const express = require('express');
const router = express.Router();

const {
  addTenantRequest,
  aceptTenantRequest,
  getUser,
  cancelTenantRequest,
  removeTenant,
  editUser,
  getMyNotifications,
  setViewedNotification,
} = require('../controllers/users');
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyID } = require('../middlewares/verifyID');

// GET A USER
router.get('/:id', verifyToken, verifyID, getUser);

// EDIT A USER
router.put('/:id', verifyToken, verifyID, editUser);

// SEND NEW TENANT REQUEST
router.post('/:id', verifyToken, verifyID, addTenantRequest);

// CANCEL A TENANT REQUEST
router.delete('/:id', verifyToken, verifyID, cancelTenantRequest);

// ACEPT NEW TENANT REQUEST
router.post('/addTenant/:id', verifyToken, verifyID, aceptTenantRequest);

// DELETE TENANT FROM BUILDING
router.delete('/removeTenant/:id', verifyToken, verifyID, removeTenant);

//######################################
// ##  NOTIFICATION REQUESTS ###########
//######################################

// Get my notifications
router.get('/:id/notifications', verifyToken, verifyID, getMyNotifications);

router.put(
  '/:id/view_notifications',
  verifyToken,
  verifyID,
  setViewedNotification
);

//######################################
// ##  USERS REQUESTS ##################
//######################################

module.exports = router;
