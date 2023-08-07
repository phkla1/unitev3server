'use strict';
const accounts = require('../controllers/accountsController');
const express = require('express');
const accountsRouter = express.Router();
const { checkToken } = require('../utils/utils');

accountsRouter
.post('/start-registration', accounts.registerUserStep1)
.post('/complete-registration', accounts.registerUserStep2)
.post('/complete-login', accounts.completeLogin)
.post('/start-login', accounts.startLogin)
.patch('/user/:userId', checkToken, accounts.updateUser)

module.exports = accountsRouter;