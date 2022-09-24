const config = require('config');
const settings = config.get('stripe');
const stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);

/*
* stripe.subscription()
* return a stripe subscription
*/

exports.subscription = async function(id){

  return await stripe.subscriptions.retrieve(id,{

    expand: ['latest_invoice.payment_intent']

  });
}

/*
* stripe.subscription.update
* upgrade or downgrade the stripe subscription to a different plan
*/

exports.subscription.update = async function(subscription, plan){

  return await stripe.subscriptions.update(subscription.id, {

    items: [{ id: subscription.items.data[0].id, plan: plan }]

  });
}

/*
* stripe.subscription.delete()
* cancel a stripe subscription
*/

exports.subscription.delete = async function(id){

  return await stripe.subscriptions.del(id);

}

/*
* stripe.customer()
* return a stripe customer
*/

exports.customer = async function(id){

  return stripe.customers.retrieve(id);

}

/*
* stripe.customer.create()
* create a new stripe customer
* token: passed from front-end payment form
*/

exports.customer.create = async function(email, token){

  return await stripe.customers.create({

    email: email,
    source: token

  });
};


/* stripe.customer.update(){
* update the customers card details
* token: passed from the front-end
*/

exports.customer.update = async function(id, token){

  return await stripe.customers.update(id, {

    source: token

  });
}

/*
* stripe.customer.invoices()
* list the invoices paid by this customer
*/

exports.customer.invoices = async function(id, limit){

  return await stripe.invoices.list({

    customer: id,
    limit: limit,

  });
}

/*
* stripe.customer.subscribe()
* subscribe the stripe customer to a plan
*/

exports.customer.subscribe = async function(id, plan){

  const subscription = await stripe.subscriptions.create({

    customer: id,
    items: [{ plan: plan }],
    enable_incomplete_payments: true,
    expand: ['latest_invoice.payment_intent']

  });

  // add the price
  subscription.price = settings.currencySymbol +
  (subscription.items.data[0].plan.amount / 100).toFixed(2);

  return subscription;

}

/*
* stripe.customer.delete()
* deletes a stripe customer
*/

exports.customer.delete = async function(customerId){

  return await stripe.customers.del(customerId);

};
