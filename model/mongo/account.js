const { v4: uuidv4 } = require('uuid');
const stripe = require('./stripe');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./user').schema;

// define schema
const AccountSchema = new Schema({

  id: { type: String, required: true, unique: true },
  plan: { type: String },
  name: { type: String },
  active: { type: Boolean, required: true },
  stripe_subscription_id: { type: String },
  stripe_customer_id: { type: String },
  date_created: { type: Date, required: true },

});

const Account = mongoose.model('Account', AccountSchema, 'account');
exports.schema = Account;

/*
* account.create()
* create a new account and return the account id
*/

exports.create = async function(){

  const data = Account({

    id: uuidv4(),
    name: 'My Account',
    active: true,
    date_created: new Date(),

  });

  const newAccount = Account(data);
  await newAccount.save();
  return data;

}

/*
* account.get()
* get an account by email or id
*/

exports.get = async function(id){

  // get the account and add the users name
  const accountData = await Account.findOne({ id: id }).lean();

  if (accountData){
  
    const userData = await User.findOne({ 
      
      'account.id': id,
      $or: [{ 'account.permission': 'owner' }, { 'account.permission': 'master' }]
    
    }).select({ name: 1, email: 1 });

    if (userData){

      accountData.owner_email = userData.email;
      accountData.owner_name = userData.name;

    }
  }

  return accountData;

}

/*
* account.subscription()
* get the subscription status for this account
*/

exports.subscription = async function(id){

  let subscription, status;

  const accountData = await Account.findOne({ id: id });
  if (!accountData) throw { message: `Account doesn't exist` };
 
   if (accountData.plan !== 'free' && accountData.stripe_subscription_id){
 
     subscription = await stripe.subscription(accountData.stripe_subscription_id);
 
     status = subscription?.status !== 'active' ?
       subscription?.latest_invoice?.payment_intent?.status :
       subscription.status;
 
     if (status !== 'active' && status !== 'trialing')
       await Account.findOneAndUpdate({ id: id }, { active: false });
 
   }
   else if (accountData.plan === 'free'){
 
     status = 'active';
 
   }
 
   return {
    
    status: status,
    data: subscription
  
  }
 }

/*
* account.update()
* update the account profile
*/

exports.update = async function(id, data){

  return await Account.findOneAndUpdate({ id: id }, data);

}

/*
* account.delete()
* delete the account and all its users
*/

exports.delete = async function(id){

  return await Account.findOneAndRemove({ id: id });

};
