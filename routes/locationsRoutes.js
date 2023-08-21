const express = require('express');
const router = express.Router();
const { addAddress, getAddresses } = require('../controllers/locationsController');

router.post('/addresses', addAddress);
router.get('/addresses', getAddresses);

module.exports = router;