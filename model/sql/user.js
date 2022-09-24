const db = require('./knex')();
const bcrypt = require('bcrypt');
const Cryptr = require('cryptr');
const crypto = new Cryptr(process.env.CRYPTO_SECRET);
const { v4: uuidv4 } = require('uuid');

/*
* user.create()
* create a new user
*/

exports.create = async function(user, account){
  
  const data = {

    id: uuidv4(),
    name: user.name,
    email: user.email,
    facebook_id: user.facebook_id,
    twitter_id: user.twitter_id,
    default_account: account

  }

  // encrypt password
  if (user.password){
  
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(user.password, salt);

  }

  await db('user').insert(data);

  if (data.password){

    delete data.password;
    data.has_password = true;

  }

  data.account_id = account;
  return data;

}

/*
* user.get()
* get a user by id, email or social network id
* will return the user on the specified account
* OR the default account
*/

exports.get = async function(id, email, account, social, permission){

  const cols = ['id', 'name', 'email', 'date_created', 'support_enabled', 
    'last_active', 'onboarded', 'facebook_id', 'twitter_id', 'disabled', 
    'account_id', 'permission', 'default_account', 'password', '2fa_enabled'];

  const data = await db('user')
  .select(cols)
  .join('account_users', 'account_users.user_id', 'user.id')
  .where({

    ...id && { id: id },
    ...email && { email: email },
    ...permission && { 'account_users.permission': permission }

  })
  .modify(q => {

    social && q.orWhere(`${social.provider}_id`, social.id);
    account && q.where('account_id', account)
    !account && (id || email || social) && q.where('account_id', db.raw('default_account'));

  });
  
  if (data?.length){
    data.forEach(u => {

      u.has_password = u.password ? true : false;
      delete u.password;

    })
  }

  return (id || email || social) ? data[0] : data;

}

/*
* user.account()
* get a list of accounts this user is attached to
*/

exports.account = async function(id){

  return await db('account_users')
  .select('account_id as id', 'name', 'permission')
  .join('account', 'account.id', 'account_users.account_id')
  .where('user_id', id)
  .orderBy('account.date_created', 'asc');

}

/*
* user.account.add()
* assign a user to an account
*/

exports.account.add = async function(id, account, permission){

  return await db('account_users')
  .insert({ user_id: id, account_id: account, permission: permission });

}

/*
* user.account.delete()
* unassign a user from an account
*/

exports.account.delete = async function(id, account){

  return await db('account_users').del()
  .where({ user_id: id, account_id: account });

}

/*
* user.password()
* return the user password hash
*/

exports.password = async function(id, account){

  const data = await db('user').select('password')
  .join('account_users', 'account_users.user_id', 'user.id')
  .where({ id: id, 'account_users.account_id': account });
  
  return data.length ? data[0] : null;

}

/*
* user.password-verify()
* check the password against the hash stored in the database
*/

exports.password.verify = async function(id, account, password){

  const data = await db('user')
  .select('name', 'email', 'password')
  .where({ id: id, 'account_users.account_id': account })
  .join('account_users', 'account_users.user_id', 'user.id');
  
  const verified = data[0]?.password ? 
    await bcrypt.compare(password, data[0].password) : false;

  delete data[0].password;
  return verified ? data[0] : false;

};

/*
* user.password.save()
* save a new password for the user
*/

exports.password.save = async function(id, password){

  // encrypt the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // save the password & get the email
  return await db('user').update({ password: hash }).where({ id: id });

}

/*
* user.2fa.secret()
* return the decrypted 2fa secret
*/

exports['2fa'] = {}

exports['2fa'].secret = async function(id, email){

  const data = await db('user').select('2fa_secret')
  .modify(q => {

    id && q.where('id', id);
    email && q.where('email', email);

  });

  return data.length ? crypto.decrypt(data[0]['2fa_secret']) : null;
 
}

exports['2fa'].backup = {};

/*
* user.2fa.backup.save()
* hash and save the users backup code
*/

exports['2fa'].backup.save = async function(id, code){

  // encrypt the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(code, salt);

  // save the password & get the email
  return await db('user').update({ '2fa_backup_code': hash }).where({ id: id });

}

/*
* user.2fa.backup.verify()
* verify the users 2fa backup code
*/

exports['2fa'].backup.verify = async function(id, email, account, code){

  const data = await db('user').select('2fa_backup_code')
  .modify(q => {

    id && q.where({ id: id, 'account.id': account });
    email && q.where('email', email);
     
  });

  return data?.[0]?.['2fa_backup_code'] ? await bcrypt.compare(code, data[0]['2fa_backup_code']) : false;

}

/*
* user.secret()
* return the user's 2fa secret
*/

exports.secret = async function(email){

  const data = await db('user').select('2fa_secret').where({ email: email });
  return data.length ? crypto.decrypt(data[0]['2fa_secret']) : null;
 
}

/*
* user.update()
* update the user profile
* profile: object containing the user data to be saved
*/

exports.update = async function(id, account, data){

  const user = {...data }

  // update cols in account_users
  if (user.permission || user.onboarded){

    await db('account_users').update({

      ...user.permission && { permission: user.permission },
      ...user.onboarded && { onboarded: user.onboarded }

    }).where('user_id', id);

    delete user.permission;
    delete user.onboarded;

  }

  // update cols in user table?
  if (Object.keys(user).length){

    await db('user').update(user)
    .where('id', function(){
  
      this.select('user_id')
      .from('account_users')
      .where({ account_id : account, user_id: id })
  
    });
  }

  return data;

}

/*
* user.delete()
* delete a single user
*/

exports.delete = async function(id, account){

  return await db('user').del()
  .where('id', function(){

    this.select('user_id')
    .from('account_users')
    .where({ account_id : account, user_id: id })

  });
};
