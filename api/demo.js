/* demo purposes only - delete me */
const express = require('express');
const auth = require('../model/auth');
const demoController = require('../controller/demoController');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

api.get('/api/demo/stats', use(demoController.stats));

api.get('/api/demo/revenue', use(demoController.revenue));

api.get('/api/demo/progress', use(demoController.progress));

api.get('/api/demo/users/list', use(demoController.users));

api.get('/api/demo/users/types', use(demoController.users.types))

api.get('/api/demo/progress', use(demoController.progress));

module.exports = api;
