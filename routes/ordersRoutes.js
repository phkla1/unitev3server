const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { checkToken } = require('../utils/utils');

router.post('/', checkToken, ordersController.createOrder);
router.get('/', checkToken, ordersController.getAllOrders);
router.get('/:id', checkToken, ordersController.getOrderById);
router.put('/:id', checkToken, ordersController.updateOrder);
router.delete('/:id', checkToken, ordersController.deleteOrder);

module.exports = router;