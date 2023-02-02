const db = require('./knex')();
const stripe = require('./stripe');
const { v4: uuidv4 } = require('uuid');

/*
* account.create()
* create a new account and return the account id
*/

exports.create = async function (plan) {

  const data = {

    id: uuidv4(),
    name: plan.toString().localeCompare('owner') === 0 ? 'Provider Account' : 'User Account',
    active: true,
    plan: plan

  }

  await db('account').insert(data);
  return data;

}

/*
* account.get()
* get an account by email or id
*/

exports.get = async function (id) {

  const data = await db('account')
    .select('account.id', 'account.name', 'account.date_created',
      'stripe_customer_id', 'stripe_subscription_id', 'plan', 'active',
      'user.email as owner_email', 'user.name as owner_name')
    .join('account_users', 'account_users.account_id', 'account.id')
    .join('user', 'account_users.user_id', 'user.id')
    .where({ 'account.id': id, permission: 'owner' })
    .orWhere({ 'account.id': id, permission: 'admin' })
    .orWhere({ 'account.id': id, permission: 'master' });

  return id ? data[0] : null;

}

/*
* account.subscription()
* get the subscription status for this account
*/

exports.subscription = async function (id) {

  let subscription, status;

  const accountData = await db('account').select('stripe_subscription_id', 'plan').where({ id: id });
  if (!accountData) throw { message: `Account doesn't exist` };

  if (accountData?.plan !== 'free' && accountData[0]?.stripe_subscription_id) {

    subscription = await stripe.subscription(accountData[0]?.stripe_subscription_id);

    status = subscription?.status !== 'active' ?
      subscription?.latest_invoice?.payment_intent?.status :
      subscription.status;

    if (status !== 'active' && status !== 'trialing')
      await db('account').update({ active: false }).where({ id: id });

  }
  else if (accountData[0]?.plan === 'free') {

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

exports.update = async function (id, data) {

  await db('account').update(data).where({ id: id });
  return data;

}

/*
* account.delete()
* delete the account and all its users
*/

exports.delete = async function (id) {

  return await db('account').del().where({ id: id });

};
