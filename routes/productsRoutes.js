'use strict';
const express = require('express');
const productsRouter = express.Router();
const productsController = require('../controllers/productsController');
const { checkToken } = require('../utils/utils');

// GET all products
productsRouter.get('/', productsController.findAllProducts);

// GET a single product by ID
productsRouter.get('/:id', checkToken, productsController.findOneProduct);

// POST a new product
productsRouter.post('/', checkToken, productsController.createProduct);

// PUT an updated product by ID
productsRouter.put('/:id', checkToken, productsController.updateProduct);

// DELETE a product by ID
productsRouter.delete('/:id', checkToken, productsController.deleteProduct);

module.exports = productsRouter;