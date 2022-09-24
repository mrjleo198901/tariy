const db = require('./knex')();

/*
* pushtoken.create()
* save a new push token for this user
*/

exports.create = async function(user, token){

  return await db('push_token').insert({ user: user, token: token });

}

/*
* pushtoken.get()
* get push tokens for the user
*/

exports.get = async function(user, token){

  let selector = { user: user }
  if (token) selector.token = token;

  return await db('push_token').select('token').where(selector);

}

/*
* pushtoken.delete()
* remove a push token for this user
*/

exports.delete = async function(token, user){

  return await db('push_token').del().where({ token: token, user: user });

}
