/* delete me after setup */
const express = require('express');
const auth = require('../model/auth');
const setupController = require('../controller/setupController');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

api.get('/api/setup/database', use(setupController.database));

api.post('/api/setup/database', use(setupController.database.update));

api.get('/api/setup/domain', use(setupController.domain));

api.post('/api/setup/domain', use(setupController.domain.update));

api.get('/api/setup/stripe', use(setupController.stripe));

api.post('/api/setup/stripe', use(setupController.stripe.update));

api.post('/api/setup/auth', use(setupController.auth));

api.get('/api/setup/mailgun', use(setupController.mailgun));

api.post('/api/setup/mailgun', use(setupController.mailgun.update));

module.exports = api;
