const express = require('express');
const auth = require('../model/auth');
const pushtokenController = require('../controller/pushtokenController');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* push_token */
api.put('/api/pushtoken/', auth.verify('user'), use(pushtokenController.create));

module.exports = api;
