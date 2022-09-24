const config = require('config');
const passport = require('passport');
const account = require('../model/account');
const invite = require('../model/invite');
const token = require('../model/token');
const user = require('../model/user');
const facebook = config.get('facebook');
const twitter = config.get('twitter');
const facebookstrategy = require('passport-facebook');
const twitterstrategy = require('passport-twitter');

// config passport
const FacebookStrategy = facebookstrategy.Strategy;
const TwitterStrategy = twitterstrategy.Strategy;

passport.serializeUser((user, done) => { done(null, user) });
passport.deserializeUser((obj, done) => { done(null, obj) });

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET){
  passport.use(
    new FacebookStrategy({

      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: facebook.callback_url,
      profileFields: ['id', 'name', 'email'],
      enableProof: true,
      passReqToCallback: true

    },
    async function(req, accessToken, refreshToken, profile, done) {
      
      await handleCallback(req, profile, { access: accessToken, refresh: refreshToken }, done);

    })
  );
}

if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET){
  passport.use(
    new TwitterStrategy({

      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: twitter.callback_url,
      userProfileURL  : 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
      passReqToCallback: true,

    },
    async function(req, accessToken, refreshToken, profile, done) {

      await handleCallback(req, profile, { access: accessToken, refresh: refreshToken }, done);

    })
  );
}

async function handleCallback(req, profile, tokens, done){

  // create a new user and/or account or sign existing user in
  // there's no global error handling available here as we're
  // using server-side routing, not an API call
  // pass errors to done() and then pass them to the client
  // in authController.social via query string
  if (!profile) 
    return done({ message: 'Error getting profile.' });

  const provider = profile.provider;
  const email = profile.emails[0]?.value;
  const data = {

    name: profile?.name?.givenName || profile.username,
    email: email,
    ...provider === 'facebook' && { facebook_id: profile.id },
    ...provider === 'twitter' && { twitter_id: profile.id },

  }

  // get the user
  let userData = await user.get(null, email, null, { provider: provider, id: profile.id });

  // user came from signup page and already has an account
  // if they don't have an owner account then create a new one
  // otherwise this user is a child user
  if (req.session.signup && !req.session.invite && userData){

    userData.accounts = await user.account(userData.id);

    // does the user have a parent account?
    if (!userData.accounts.find(x => x.permission === 'owner')){

      const accountData = await account.create();
      await user.account.add(userData.id, accountData.id, 'owner');
      await user.update(userData.id, accountData.id, { default_account: accountData.id });

    }
  }

  // this is an invite to a child account
  if (req.session.invite){

    const inviteData = await invite.get(req.session.invite);
    if (!inviteData) return done({ message: 'Invalid invite. Please contact the account holder' });
   
    // update user existing user
    if (userData){

      const social = { default_account: inviteData.account_id };
      social[`${provider}_id`] = profile.id;
      await user.update(userData.id, userData.account_id, social)

    }
    else {

      // create a new user
      userData = await user.create(data, inviteData.account_id);

    }

    // assign the user to the parent account and close the invite
    await user.account.add(userData.id, inviteData.account_id, inviteData.permission);
    await invite.update(req.session.invite, { used: true }); 

  }
  else if (userData){

    // user exists, authenticate them and add additional social if necessary
    if (!userData[`${provider}_id`]){

      const social = {};
      social[`${provider}_id`] = profile.id;
      await user.update(userData.id, userData.account_id, social)

    }  

    // done, pass execution to authController
    await token.save(provider, tokens, userData.id);
    return done(null, profile);

  }
  else {

    // user doesn't exist and wasn't invited - create user & account
    const accountData = await account.create();
    userData = await user.create(data, accountData.id);
    await user.account.add(userData.id, accountData.id, 'owner');

  }

  // done - save token and pass to authController
  await token.save(provider, tokens, userData.id);
  done(null, profile);

}