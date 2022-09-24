const express = require('express');
const config = require('config');
const auth = require('../model/auth');
const limiter = require('express-rate-limit');
const userController = require('../controller/userController');
const throttle = config.get('throttle');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* user */
api.post('/api/user', limiter(throttle.signup), use(userController.create));

api.get('/api/user', auth.verify('user', 'user.read'), use(userController.get));

api.get('/api/user/account', auth.verify('user', 'user.read'), use(userController.account));

api.get('/api/user/permissions', auth.verify('user', 'user.read'), use(userController.permissions));

api.patch('/api/user', auth.verify('user', 'user.update'), use(userController.update));

api.put('/api/user/password', auth.verify('user'), use(userController.password));

api.put('/api/user/2fa', auth.verify('user'), use(userController['2fa']));

api.post('/api/user/2fa/verify', auth.verify('user'), use(userController['2fa'].verify));

api.delete('/api/user', auth.verify('user', 'user.delete'), use(userController.delete));

module.exports = api;
