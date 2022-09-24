const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Cryptr = require('cryptr');
const crypto = new Cryptr(process.env.CRYPTO_SECRET);
const Schema = mongoose.Schema;

// define schema
const UserSchema = new Schema({

  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  date_created: Date,
  last_active: Date,
  disabled: { type: Boolean },
  support_enabled: { type: Boolean, required: true },
  '2fa_enabled': { type: Boolean, required: true },
  '2fa_secret': { type: String, required: false },
  '2fa_backup_code': { type: String, required: false },
  default_account: { type: String, required: true },
  facebook_id: { type: String },
  twitter_id: { type: String },
  account: { type: Array }

});

const User = mongoose.model('User', UserSchema, 'user');
exports.schema = User;

/*
* user.create()
* create a new user
*/

exports.create = async function(user, account){
  
  const data = {

    id: uuidv4(),
    name: user.name,
    email: user.email,
    date_created: new Date(),
    last_active: new Date(),
    support_enabled: false,
    '2fa_enabled': false,
    facebook_id: user.facebook_id,
    twitter_id: user.twitter_id,
    default_account: account,

  }
  

  // encrypt password
  if (user.password){

    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(user.password, salt);

  }

  const newUser = User(data);
  await newUser.save();

  if (data.password){

    delete data.password;
    data.has_password = true;

  }
  
  data.account_id = account;
  return data;

}

/*
* user.get()
* get a user by email or user id
*/

exports.get = async function(id, email, account, social, permission){

  let data;
  const cond = {

    ...account && { 'account.id': account },
    ...permission && { 'account.permission': permission },
    
  };

  if (social){
  
    cond[`${social.provider}_id`] = social.id;
    data = await User.find({ $or: [{ email: email }, cond]}).lean();

  }
  else {

    data = await User.find({...cond, ...{

      ...id && { id: id },
      ...email && { email: email },

    }}).lean();

  }

  if (data?.length){    
    data.forEach(u => {
      
      // get id, perm and onboarded for this account
      u.account_id = account || u.default_account;
      const a = u.account.find(x => x.id === u.account_id);
      u.permission = a.permission;
      u.onboarded = a.onboarded;

      u.has_password = u.password ? true : false;
      delete u.password;
      delete u.account;

    })
  }

  return (id || email || social) ? data[0] : data;

}

/*
* user.account()
* get a list of accounts this user is attached to
*/

exports.account = async function(id){

  const data = await User.aggregate([
    { $match: { id: id }},
    { $project: { id: 1, account: 1, email: 1 }},
    { $lookup: {

      from: 'account',
      localField: 'account.id',
      foreignField: 'id',
      as: 'account_data'
        
     }}
    ]);
  
  // format
  return data[0]?.account.map(a => { 
    return {

      id: a.id,
      user_id: data[0].id,
      permission: a.permission,
      name: data[0].account_data.find(x => x.id === a.id)?.name

    }
  });
}

/*
* user.account.add()
* assign a user to an account
*/

exports.account.add = async function(id, account, permission){

  const data = await User.findOne({ id: id });

  if (data){

    data.account.push({ id: account, permission: permission, onboarded: false });
    data.markModified('account');
    return await data.save();

  }

  throw { message: `No user with that ID` };

}

/*
* user.account.delete()
* remove a user from an account
*/

exports.account.delete = async function(id, account){

  const data = await User.findOne({ id: id });

  if (data){

    data.account.splice(data.account.findIndex(x => x.id === account), 1);
    doc.markModified('account');
    return await data.save();

  }

  throw { message: `No user with that ID` };

}

/*
* user.password()
* return the user hash
*/

exports.password = async function(id, account){

  return await User.findOne({ id: id, 'account.id': account })
  .select({ password: 1 });

}

/*
* user.password-verify()
* check the password against the hash stored in the database
*/

exports.password.verify = async function(id, account, password){
  
  const data = await User.findOne({ id: id, 'account.id': account })
  .select({ name: 1, email: 1, password: 1 });

  const verified = data?.password ? 
    await bcrypt.compare(password, data.password) : false;

  delete data.password;
  return verified ? data : false;

};

/*
* user.password.save()
* save a new password for the user
* if not executed via a password reset request, the user is notified
* by email that their password has been changed
* passwordReset: true/false to determine of password update is part of reset
*/

exports.password.save = async function(id, password, reset){

  // encrypt & save the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return await User.findOneAndUpdate({ id: id },{ password: hash });

}

/*
* user.2fa.secret()
* return the decrypted 2fa secret
*/

exports['2fa'] = {};

exports['2fa'].secret = async function(id, email){

  const data = await User.findOne({ 
    
    ...id && { id: id },
    ...email && { email: email } 
  
  }).select({ '2fa_secret': 1 });
  
  return data ? crypto.decrypt(data['2fa_secret']) : null;
 
}

exports['2fa'].backup = {};

/*
* user.2fa.backup.save()
* hash and save the users backup code
*/

exports['2fa'].backup.save = async function(id, code){

  // encrypt & save the backup code
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(code, salt);
  return await User.findOneAndUpdate({ id: id },{ '2fa_backup_code': hash });

}

/*
* user.2fa.backup.verify()
* verify the users 2fa backup code
*/

exports['2fa'].backup.verify = async function(id, email, account, code){

  const data = await User.findOne({
    
    ...id && { id: id, 'account.id': account },
    ...email && { email: email },
      
  }).select({ '2fa_backup_code': 1 });

  return data?.['2fa_backup_code'] ? await bcrypt.compare(code, data['2fa_backup_code']) : false;

}

/*
* user.update()
* update the user profile
* profile: object containing the user data to be saved
*/

exports.update = async function(id, account, data){

  // update nested objects
  if (data.onboarded || data.permission){
    User.findOne({ id: id, 'account.id': account }, (err, doc) => {

      if (err) throw (err)
      if (!doc) throw { message: `No user with that ID` };

      const index = doc.account.findIndex(x => x.id === account);

      if (data.onboarded)
        doc.account[index].onboarded = data.onboarded;

      if (data.permission)
        doc.account[index].permission = data.permission;
      
      doc.markModified('account');
      doc.save();
  
    });
  }
  else {

    await User.findOneAndUpdate({ id: id, 'account.id': account }, data);

  }

  return data;

}

/*
* user.delete()
* delete the user
*/

exports.delete = async function(id, account){

  return await User.deleteMany({

    ...id && { id: id },
    'account.id': account

  });
};
