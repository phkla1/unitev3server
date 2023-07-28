'use strict';
const express = require('express');
const productsRouter = express.Router();
const productsController = require('../controllers/productsController');

// GET all products
productsRouter.get('/', productsController.findAllProducts);

// GET a single product by ID
productsRouter.get('/:id', productsController.findOneProduct);

// POST a new product
productsRouter.post('/', productsController.createProduct);

// PUT an updated product by ID
productsRouter.put('/:id', productsController.updateProduct);

// DELETE a product by ID
productsRouter.delete('/:id', productsController.deleteProduct);

module.exports = productsRouter;