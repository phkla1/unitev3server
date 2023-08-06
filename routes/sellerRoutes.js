const express = require('express');
const router = express.Router();
const sellersController = require('../controllers/sellersController');
const { checkToken } = require('../utils/utils');

// Create a new seller
router.post('/', sellersController.createSeller);

// Get all sellers
router.get('/', checkToken, sellersController.getAllSellers);

// Get a single seller by ID
router.get('/:id', sellersController.getSellerById);

// Update a seller by ID
router.put('/:id', checkToken, sellersController.updateSellerById);

// Delete a seller by ID
router.delete('/:id', checkToken, sellersController.deleteSellerById);

module.exports = router;