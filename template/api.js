const express = require('express');
const auth = require('../model/auth');
const {{view}}Controller = require('../controller/{{view}}Controller');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

api.post('/api/{{view}}', auth.verify('user'), use({{view}}Controller.create));

api.patch('/api/{{view}}/:id', auth.verify('user'), use({{view}}Controller.update));

api.get('/api/{{view}}', auth.verify('user'), use({{view}}Controller.get));

api.get('/api/{{view}}/:id', auth.verify('user'), use({{view}}Controller.get));

api.delete('/api/{{view}}/:id', auth.verify('admin'), use({{view}}Controller.delete));

module.exports = api;
