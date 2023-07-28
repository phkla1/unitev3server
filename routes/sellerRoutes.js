const express = require('express');
const router = express.Router();
const sellersController = require('../controllers/sellersController');

// Create a new seller
router.post('/', sellersController.createSeller);

// Get all sellers
router.get('/', sellersController.getAllSellers);

// Get a single seller by ID
router.get('/:id', sellersController.getSellerById);

// Update a seller by ID
router.put('/:id', sellersController.updateSellerById);

// Delete a seller by ID
router.delete('/:id', sellersController.deleteSellerById);

module.exports = router;