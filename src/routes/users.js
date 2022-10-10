const express = require('express');
const {
  addTenantRequest,
  aceptTenantRequest,
  getUser,
  cancelTenantRequest,
} = require('../controllers/users');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyID } = require('../middlewares/verifyID');

// GET A USER
router.get('/:id', verifyToken, verifyID, getUser);

// SEND NEW TENATN REQUEST
router.post('/:id', verifyToken, verifyID, addTenantRequest);

// SEND NEW TENATN REQUEST
router.post('/addTenant/:id', verifyToken, verifyID, aceptTenantRequest);

// CANCEL A TENATN REQUEST
router.delete('/:id', verifyToken, verifyID, cancelTenantRequest);

// CREATE A USER
router.post('/', (req, res) => {
  console.log('GET :' + req.params.id);
});

// EDIT A USER
router.put('/:id', (req, res) => {
  console.log('GET :' + req.params.id);
});

// DELETE A USER
router.delete('/:id', (req, res) => {
  console.log('GET :' + req.params.id);
});

module.exports = router;
