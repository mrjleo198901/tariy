const db = require('./knex')();
const { v4: uuidv4 } = require('uuid');

/*
* event.create()
* create a new event
*/

exports.create = async function(data, user, account){

  data.id = uuidv4();
  data.user_id = user;
  data.account_id = account;
  if (data.metadata) data.metadata = JSON.stringify(data.metadata);

  await db('event').insert(data);
  return data;

}