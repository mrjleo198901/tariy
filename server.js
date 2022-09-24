require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
const api = require('./api');
const router = require('./router');
const path = require('path');
const config = require('config');
const log = require('./model/log');
const throttle = config.get('throttle');
const limiter = require('express-rate-limit');

const port = process.env.PORT || 8080;
const app = express();

// helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'https://api.stripe.com', `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
        childSrc: ["'self'", 'https://js.stripe.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://js.stripe.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'https://*.stripe.com', `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`, 'data:', 'blob:'],
        baseUri: ["'self'"],
     }
    }
  })
);

// cors
const opts = { origin: [
  process.env.CLIENT_URL, 
  process.env.MISSION_CONTROL_CLIENT, 
  process.env.PRODUCTION_DOMAIN
]};

app.use(cors(opts));
app.options('*', cors(opts));

// init passport
app.use(passport.initialize());

// config express
app.use(express.json());
app.set('trust proxy', 1); // rate limit proxy
app.use(express.urlencoded({ extended: true }));


// api with rate limiter
app.use('/api/', limiter(throttle.api));
app.use(api);

// router (for non-react routes)
app.use(router);

// serve static files in production
if (process.env.NODE_ENV === 'production'){

  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/build/index.html'))
  });
}

// error handling
app.use(function(err, req, res, next){

  let message = null;

  if (err.raw){

    message = err.raw.message;

  }
  else if (err.message){

    message = err.message;

  }
  else if (err.sqlMessage){

    message = err.sqlMessage;

  }

  console.error(err);
  log.create(message, err, req);

  message ?
    res.status(500).send({ message: message }) :
    res.status(500).send(err);

});

// start server
const server = app.listen(port, async () => {

  console.log('Welcome to Gravity 🚀');

});

module.exports = server;




