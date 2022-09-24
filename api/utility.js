const express = require('express');
const multer = require('multer');
const auth = require('../model/auth');
const utilityController = require('../controller/utilityController');
const upload = multer({ dest: 'uploads' });
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

api.post('/api/utility/upload', auth.verify('user'), upload.any(), use(utilityController.upload));

api.post('/api/utility/mail', use(utilityController.mail));

module.exports = api;
