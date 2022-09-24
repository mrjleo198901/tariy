const chalk = require('chalk');
const setup = require('../model/setup');
const account = require('../model/account');
const user = require('../model/user');
const utility = require('../model/utilities');
const randomstring = require('randomstring');
const backendSettings = require('../config/default');
const fs = require('fs').promises;

/*
* setup.database()
* get the database settings
*/

exports.database = async function(req, res){
  
  return res.status(200).send({ data: {

    client: process.env.DB_CLIENT,
    connection: {

      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME

    }
  }});

}

/*
* setup.database.update()
* configure the database settings
*/

exports.database.update =  async function(req, res){

  let settings = { client: req.body.client }
  delete req.body.client;
  settings.connection = req.body;
  settings.connection.port = Number(settings.connection.port);

  // generate random strings
  await setup.env('TOKEN_SECRET', randomstring.generate(64));
  await setup.env('CRYPTO_SECRET', randomstring.generate(64));
  await setup.env('SESSION_SECRET', randomstring.generate(64));

  if (settings.client === 'mongo'){

    await setup.database.mongo();
    await setup.package(null, ['mysql', 'knex']); // clean package.json

  }
  else {

    settings.connection.ssl = { rejectUnauthorized: false };
    await setup.database.sql(settings);
    await setup.package(null, ['mongodb', 'mongoose', 'express-mongo-sanitize']); // clean package.json

  }

  await setup.env('DB_CLIENT', settings.client);
  await setup.env('DB_USER', settings.connection.user);
  await setup.env('DB_PASSWORD', settings.connection.password);
  await setup.env('DB_HOST', settings.connection.host);
  await setup.env('DB_NAME', settings.connection.database);
  await setup.env('DB_PORT', settings.connection.port);

  console.log(chalk.green('Database created'));
  return res.status(200).send({ message: 'Database tables created' });

};

/*
* setup.stripe()
* get the stripe settings
*/

exports.stripe = async function(req, res){

  const frontendSettings = require('../../client/src/settings.json');
  let settings = backendSettings.stripe;
  settings.publishableAPIKey = frontendSettings.development.stripe.publishableAPIKey;
  return res.status(200).send({ data: settings });

};

/*
* setup.stripe.update()
* save stripe settings
*/

exports.stripe.update = async function(req, res){

  const data = req.body;
  utility.validate(data, ['test_pk', 'test_sk']);

  // save keys
  await setup.client({ stripe: { publishableAPIKey: data.test_pk }}, 'development');
  await setup.client({ stripe: { publishableAPIKey: data.live_pk }}, 'production');
  await setup.env('STRIPE_SECRET_API_KEY', data.test_sk); 
  
  // save plans
  const testconfig = await setup.stripe(data.test_sk, data.freePlan);  
  await setup.settings('stripe', testconfig, 'development'); // save plans

  if (data.live_sk){

    const prodconfig = await setup.stripe(data.live_sk, data.freePlan);  
    await setup.settings('stripe', prodconfig, 'production'); // save plans

  }

  console.log(chalk.green('Stripe settings updated'));
  return res.status(200).send({ message: 'Stripe settings updated' });

};

/*
* setup.mailgun()
* get mailgun settings
*/

exports.mailgun = async function(req, res){

  return res.status(200).send({ data: backendSettings.mailgun });

}

/*
* setup.mailgun.update()
* save mailgun settings
*/

exports.mailgun.update = async function(req, res){

  const data = req.body;
  utility.validate(data, ['apiKey', 'domain', 'host', 'sender']);

  await setup.env('MAILGUN_API_KEY', data.apiKey); // save key
  delete data.apiKey;
  
  data.base_url = data.host.includes('eu') ? 'https://api.eu.mailgun.net/v3' : 'https://api.mailgun.net/v3';
  await setup.settings('mailgun', data); 

  console.log(chalk.green('Mailgun settings updated'));
  return res.status(200).send({ message: 'Mailgun settings updated' });

}

/*
* setup.domain()
* get the domain settings
*/

exports.domain = async function(req, res){

  res.status(200).send({ data: {

    support_email: process.env.SUPPORT_EMAIL,
    production_domain: process.env.PRODUCTION_DOMAIN,
    
  }});
}

/*
* setup.domain.update()
* save the production domain settings
*/

exports.domain.update = async function(req, res){

   // save the production domain
  const data = req.body;
  await setup.settings('domain', data.domain, 'production');
  await setup.settings('facebook', {

    scope: ['email'],
    callback_url: `${data.domain}/auth/facebook/callback`

  }, 'production');

  await setup.settings('twitter', {

    scope: [],
    callback_url: `${data.domain}/auth/twitter/callback`

  }, 'production');

  // save server url in client 
  await setup.client({ server_url: data.domain }, 'production');
  await setup.env('PRODUCTION_DOMAIN', data.domain); // save key
  await setup.env('SUPPORT_EMAIL', data.support_email); 

  res.status(200).send({ message: 'Domain saved' });
  
}

/*
* setup.auth()
* save the auth/social sign on settings
*/

exports.auth = async function(req, res){

  // save keys
  const data = req.body;
  await setup.env('FACEBOOK_APP_ID', data.facebook_app_id);
  await setup.env('FACEBOOK_APP_SECRET', data.facebook_app_secret);
  await setup.env('TWITTER_API_KEY', data.twitter_api_key);
  await setup.env('TWITTER_API_SECRET', data.twitter_api_secret);
  res.status(200).send({ message: 'Authentication settings saved '});

}