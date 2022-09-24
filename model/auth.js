const jwt = require('jsonwebtoken');
const config = require('config');
const key = require('./key');
const log = require('./log');
const utility = require('./utilities');
const permissions = config.get('permissions');
const settings = config.get('token');

/*
* auth.token()
* generate a JSON web token
*/

exports.token = function(data, secret, duration){

  return jwt.sign(data, secret || process.env.TOKEN_SECRET, { expiresIn: duration || settings.duration });

}

/*
* auth.token.verify()
* verify a JWT
*/

exports.token.verify = function(token, secret){

  return jwt.verify(token, secret || process.env.TOKEN_SECRET);

}

/*
* auth.verify()
* verify the user
*/

exports.verify = function(permission, scope){

  return async function(req, res, next){

    try {

      const header = req.headers['authorization'];

      // check header was provided
      if (!header){
        if (permission === 'public'){

          return next();

        }
        else {

          throw { message: 'No authorization header provided' };

        }
      }   

      // process the header 
      const type = header.split(' ')[0];
      const token = header.split(' ')[1];

      // request is using api key
      if (type === 'Basic'){

        // use plaintext api key or decode base64
        const apikey = token.includes('key-') ? token : utility.base64.decode(token).replace(':', '');

        const verified = await key.verify(apikey);
        utility.assert(verified, 'Invalid API key');

        // key ok, check scope
        utility.assert(verified.scope.includes(scope), `You don't have permission to use this scope`);
       
        // log request and continue
        if (process.env.ENABLE_API_LOGS === 'true')
          log.create(null, req.body, req, false, null, verified.account_id);

        req.account = verified.account_id;
        next();

      }
      else if (type === 'Bearer'){

        const decode = jwt.verify(token, process.env.TOKEN_SECRET);

        if (decode.accountId && decode.userId && decode.permission && decode.provider){
          if (permission === 'public' || permissions[decode.permission][permission]){

            req.account = decode.accountId;
            req.user = decode.userId;
            req.permission = decode.permission;
            req.provider = decode.provider;
            next();

          } else throw new Error(); // user doesn't have permission
        }
        else throw { message: 'Invalid token' }; // invalid auth token
      }
      else throw { message: 'Unrecognised header type' }; // unknown header type
    }
    catch (err){
      
      res.status(401).send({

        message: err.message || 'You do not have permission to perform this action.',

      });
    }
  }
}