const db = require('./knex')();
const randomstring = require('randomstring');

/*
* invite.create()
* create a new user invite to join an account
*/

exports.create = async function(email, permission, account){

  // create a new invite
  const data = {

    id: randomstring.generate(16),
    email: email,
    used: false,
    permission: permission || 'user',
    date_sent: new Date(),
    account_id: account,

  }

  await db('invite').insert(data);
  return data;

}

/*
* invite.get()
* return the invite for the new user
*/

exports.get = async function(id, email, account, returnArray){
  
  const data = await db('invite')
  .select('id', 'email', 'permission', 'date_sent', 'account_id')
  .where({

    ...id && { id: id },
    ...email && { email: email },
    ...account && { account_id: account },
    used: false,

  });

  return data.length ? (returnArray ? data : data[0]) : null;

}

/*
* invite.update()
* update the invite
*/

exports.update = async function(id, data){

  return await db('invite').update(data).where({ id: id });

}

/*
* invite.delete()
* delete an invite
*/

exports.delete = async function(id, account){

  return await db('invite').del().where({ id: id, account_id: account });

}
