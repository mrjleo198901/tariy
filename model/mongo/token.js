const mongoose = require('mongoose');
const Cryptr = require('cryptr');
const crypto = new Cryptr(process.env.CRYPTO_SECRET);
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const TokenSchema = new Schema({

  id: { type: String, required: true, unique: true },
  provider: { type: String, required: true },
  jwt: { type: String },
  access: { type: String },
  refresh: { type: String },
  user_id: { type: String, required: true }

});

const Token = mongoose.model('Token', TokenSchema, 'token');

/*
* token.save()
* create new or update an existing token
*/

exports.save = async function(provider, data, user){

  if (data.access)
    data.access = crypto.encrypt(data.access)

  if (data.refresh)
    data.refresh = crypto.encrypt(data.refresh);

  // is there already a token for this provider?
  const tokenData = await Token.findOne({ provider: provider, user_id: user });

  // update existing token
  if (tokenData){

    await Token.findOneAndUpdate({ id: tokenData.id, user_id: user }, data);

  }
  else {

    // create a new token
    const newToken = Token({

      id: uuidv4(),
      provider: provider,
      jwt: data.jwt,
      access: data.access,
      refresh: data.refresh, 
      user_id: user 

    });

    await newToken.save();

  }
  
  return data;
  
}

/*
* token.get()
* return the token for the new user
*/

exports.get = async function(id, provider, user, skipDecryption){
  
  const data = await Token.find({

    user_id: user,
    ...id && { id: id },
    ...provider && { provider: provider },

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

  const data = await Token.find({ user_id: user, provider: provider });
  return data.length ? true : false;
  
}

/*
* token.delete()
* delete an token
*/

exports.delete = async function(id, provider, user){

  return await Token.deleteOne({ 
    
    user_id: user,
    ...provider && { provider: provider },
    ...id && { id: id }
  
  });
}
