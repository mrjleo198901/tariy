const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const utility = require('./utilities');
const Schema = mongoose.Schema;

// define schema
const KeySchema = new Schema({

  id: { type: String, required: true, unique: true },
  name: { type: String },
  key: { type: String, required: true, unique: true },
  scope: { type: Array, required: true },
  date_created: { type: Date, required: true },
  active: { type: Boolean, required: true },
  account_id: { type: String, required: true },

});

const Key = mongoose.model('Key', KeySchema, 'key');

/*
* key.create()
* save a new api key
*/

exports.create = async function(data, account){

  data.id = uuidv4();
  data.active = true;
  data.account_id = account;
  data.date_created = new Date();

  const newKey = Key(data);
  await newKey.save();

  data.full_key = data.key;
  data.key = utility.mask(data.key);
  return data;

}

/*
* key.get()
* return a single or list of api keys
*/

exports.get = async function(id, name, account){

  const data = await Key.find({

    ...id && { id: id },
    ...name && { name: name },
    account_id: account

  });

  if (data.length){
    data.map(x => {

      // when listing the keys mask them, reveal full keys on individual api calls
      if (!id) x.key = utility.mask(x.key);

    });
  }

  return data;

}

/*
* key.unique()
* determine if the key is unique
*/

exports.unique = async function(key){

  const data = await Key.find({ key: key });
  return !data.length;

}

/*
* key.verify()
* verify the api key and return the account id
*/

exports.verify = async function(key){

  const data = await Key.findOne({ key: key, active: true }).select({ scope: 1, account_id: 1  });
  return data || false;

}

/*
* key.revoke()
* revoke an api key by setting the active col to false
*/

exports.update = async function(id, data, account){

  return await Key.updateOne({ id: id, account_id: account }, data);

}

/*
* key.delete()
* completely remove an api key from the database
*/

exports.delete = async function(id, account){

  return await Key.deleteOne({ id: id, account_id: account });

}
