const express = require('express');
const router = express.Router();
const { addAddress, getAddresses, getStreets } = require('../controllers/locationsController');

router.post('/addresses', addAddress);
router.get('/addresses', getAddresses);
router.get('/streets/:locationId', getStreets);
router.post('/address', addAddress);

module.exports = router;