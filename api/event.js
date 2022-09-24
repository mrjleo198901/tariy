const express = require('express');
const auth = require('../model/auth');
const eventController = require('../controller/eventController');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

api.post('/api/event', auth.verify('public'), use(eventController.create));

module.exports = api;
