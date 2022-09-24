const db = require('./knex')();
const utility = require('./utilities');
const { v4: uuidv4 } = require('uuid');

/*
* key.create()
* save a new api key
*/

exports.create = async function(data, account){

  data.id = uuidv4();
  data.account_id = account;
  data.scope = JSON.stringify(data.scope);

  await db('api_key').insert(data);

  data.full_key = data.key
  data.key = utility.mask(data.key);
  data.scope = JSON.parse(data.scope);
  return data;

}

/*
* key.get()
* return a single or list of api keys
*/

exports.get = async function(id, name, account){

  const data = await db('api_key')
  .select('id', 'name', 'key', 'scope', 'active')
  .where({ account_id: account })
  .modify(q => {

    id && q.where('id', id);
    name && q.where('name', name);

  });

  if (data.length){
    data.map(x => {

      // when listing the keys mask them, reveal full keys on individual api calls
      if (!id) x.key = utility.mask(x.key);

      // binary > truth
      x.scope = JSON.parse(x.scope);
      x.active = x.active = x.active === 0 ? false : true; 

    });
  }

  return data;
  
}

/*
* key.unique()
* determine if the api key is unique
*/

exports.unique = async function(key){

  const data = await db('api_key').select('active').where('key', key);
  return !data.length;

}

/*
* key.verify()
* verify the api key and return the account id
*/

exports.verify = async function(key){

  const data = await db('api_key')
  .select('scope', 'account_id')
  .where({ key: key, active: true });

  return data.length ? data[0] : false;
  
}

/*
* key.update()
* update the api key
*/

exports.update = async function(id, data, account){

  if (data.scope) data.scope = JSON.stringify(data.scope);
  await db('api_key').update(data).where({ id: id, account_id: account });

}

/*
* key.delete()
* delete an api key
*/

exports.delete = async function(id, account){

  await db('api_key').del().where({ id: id, account_id: account });

}
