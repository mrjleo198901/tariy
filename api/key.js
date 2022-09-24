const express = require('express');
const auth = require('../model/auth');
const keyController = require('../controller/keyController');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

api.post('/api/key', auth.verify('developer', 'key.create'), use(keyController.create));

api.get('/api/key', auth.verify('developer', 'key.read'), use(keyController.get));

api.get('/api/key/:id', auth.verify('developer', 'key.read'), use(keyController.get));

api.get('/api/scopes', auth.verify('developer', 'key.read'), use(keyController.scopes));

api.patch('/api/key/:id', auth.verify('developer', 'key.update'), use(keyController.update));

api.delete('/api/key/:id', auth.verify('developer', 'key.delete'), use(keyController.delete));

module.exports = api;
