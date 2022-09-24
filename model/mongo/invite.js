const mongoose = require('mongoose');
const randomstring = require('randomstring');
const Schema = mongoose.Schema;

// define schema
const InviteSchema = new Schema({

  id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  permission: { type: String, required: true },
  account_id: { type: String, required: true },
  date_sent: { type: Date, required: true },
  used: { type: Boolean, required: true },

});

const Invite = mongoose.model('Invite', InviteSchema, 'invite');

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

  const newInvite = Invite(data);
  await newInvite.save();
  return data;

}

/*
* invite.get()
* return the invite for the new user
*/

exports.get = async function(id, email, account, returnArray){

  const data = await Invite.find({

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

  // set invite status to used so it can't be used again
  await Invite.updateOne({ id: id }, data);
  return data

}

/*
* invite.delete()
* delete an invite
*/

exports.delete = async function(id, account){

  return await Invite.deleteOne({ id: id, account_id: account });

}
