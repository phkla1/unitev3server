const express = require('express');
const router = express.Router();
const walletsController = require('../controllers/walletsController');
const { checkToken } = require('../utils/utils');

//get all user wallets
router.get('/', walletsController.getUserWallets);

//get wallet by id
router.get('/:walletId', checkToken, walletsController.getWallet);

//update wallet balance
router.put('/:walletId', checkToken, walletsController.updateWalletBalance);

module.exports = router;