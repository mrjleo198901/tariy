const express = require('express');
const auth = require('../model/auth');
const feedbackController = require('../controller/feedbackController');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

api.post('/api/feedback', auth.verify('user'), use(feedbackController.create));

module.exports = api;
