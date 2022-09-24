const express = require('express');
const auth = require('../model/auth');
const inviteController = require('../controller/inviteController');
const api = express.Router();

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* invites */
api.post('/api/invite', auth.verify('admin', 'invite.create'), use(inviteController.create));

api.get('/api/invite', auth.verify('admin', 'invite.read'), use(inviteController.get));

api.get('/api/invite/:id', auth.verify('admin', 'invite.read'), use(inviteController.get));

api.delete('/api/invite', auth.verify('admin', 'invite.delete'), use(inviteController.delete));

module.exports = api;
