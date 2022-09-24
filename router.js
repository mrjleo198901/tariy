const express = require('express');
const limiter = require('express-rate-limit');
const passport = require('passport');
const config = require('config');
const session = require('cookie-session')({ name: 'session', secret: process.env.SESSION_SECRET })
const authController = require("./controller/authController");
const router = express.Router();
const throttle = config.get('throttle');

/*
* caller function for global error handling
* route all calls through this to try and handle errors
*/

const use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// sign in with social provider
router.get('/auth/:provider', limiter(throttle.signin), session, (req, res, next) => {
  
  // store the invite id (if present) is so this can be
  // used to attach a child user to its parent via the invite
  req.session.invite = req.query.invite;
  req.session.signup = parseInt(req.query.signup);

  // store the deep linking urls passed from the app
  req.session.deep_signin_url = req.query.signin_url;
  req.session.deep_social_url = req.query.social_url;

  // authenticate the user for the provider network
  passport.authenticate(req.params.provider, { 
    
    scope: config.get(req.params.provider).scope,
  
  })(req, res, next);
});

router.get('/auth/:provider/callback', session, use(authController.social));

module.exports = router;
