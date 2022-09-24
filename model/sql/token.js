const db = require('./knex')();
const Cryptr = require('cryptr');
const crypto = new Cryptr(process.env.CRYPTO_SECRET);
const { v4: uuidv4 } = require('uuid');

/*
* token.save()
* create or update a new tokens
*/

exports.save = async function(provider, data, user){

  if (data.access)
    data.access = crypto.encrypt(data.access)

  if (data.refresh)
    data.refresh = crypto.encrypt(data.refresh);

  // is there already a token for this provider?
  const tokenData = await db('token').select('*')
  .where({ provider: provider, user_id: user });

  // update existing token
  if (tokenData.length)
    await db('token').update(data).where({ id: tokenData[0].id, user_id: user })

  // create a new token
  else {

    data.id = uuidv4();
    data.provider = provider;
    data.user_id = user;
    await db('token').insert(data);

  }

  return data;
  
}

/*
* token.get()
* get an access token for a user by id or provider
*/

exports.get = async function(id, provider, user, skipDecryption){

  const data = await db('token').select('*')
  .where('user_id', user)
  .modify(q => {

    id && q.where('id', id)
    provider && q.where('provider', provider)

  });

  if (data.length && !skipDecryption){
    data.forEach(token => {

      if (token.access)
        token.access = crypto.decrypt(token.access)
  
      if (token.refresh)
        token.refresh = crypto.decrypt(token.refresh);
  
    });
  }

  return data;

}

/*
* token.verify()
* check if a token is present for provider/user
*/

exports.verify = async function(provider, user){

  const data = await db('token').select('id')
  .where({ provider:  provider, user_id: user });

  return data.length ? true : false;
  
}

/*
* token.delete()
* delete a token
*/

exports.delete = async function (id, provider, user){

  return await db('token').del()
  .where({ user_id: user })
  .modify(q => {

    id && q.where('id', id);
    provider && q.where('provider', provider);

  });
}