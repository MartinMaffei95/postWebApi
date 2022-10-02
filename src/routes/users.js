const express = require('express');
const router = express.Router();

// GET A USER
router.get('/:id', (req, res) => {
  console.log('GET :' + req.params.id);
});

// CREATE A USER
router.get('/:id', (req, res) => {
  console.log('GET :' + req.params.id);
});

// EDIT A USER
router.get('/:id', (req, res) => {
  console.log('GET :' + req.params.id);
});

// DELETE A USER
router.get('/:id', (req, res) => {
  console.log('GET :' + req.params.id);
});

module.exports = router;
