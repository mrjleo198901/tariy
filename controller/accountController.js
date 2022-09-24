const config = require('config');
const chalk = require('chalk');
const settings = config.get('stripe');
const account = require('../model/account');
const user = require('../model/user');
const stripe = require('../model/stripe');
const mail = require('../model/mail');
const log = require('../model/log');
const token = require('../model/token');
const invite = require('../model/invite');
const utility = require('../model/utilities');
const authController = require('../controller/authController');

/*
* account.create()
* create a new account part 1: email/pass or social
*/

exports.create = async function(req, res){

  const data = req.body;
  utility.validate(data, ['email', 'name', 'password']);

  // confirm_password field is a dummy field to prevent bot signups
  if (data.hasOwnProperty('confirm_password') && data.confirm_password)
    throw { message: 'Registration denied' };

  // check if user has already registered an account
  let userData = await user.get(null, data.email);

  if (userData){
    
    // user already owns an account
    if (userData.permission === 'owner')
      throw { inputError: 'email', message: 'You have already registered an account' };

    // flag for authController to notify onboarding ui
    // that the user's existing account was used
    req.body.duplicate_user = true; 
    req.body.has_password = userData.has_password;

    // save the new password if it exists and user doesn't have one
    if (!req.body.has_password && req.body.password)
      await user.password.save(userData.id, req.body.password);

  }

  console.log(chalk.cyan('Creating account for: ') + data.email);

  // create the account
  const accountData = await account.create(data.plan);
  req.body.account_id = accountData.id; // pass to auth controller to select new account

  // create the user and assign to account
  userData = !userData ? await user.create(data, accountData.id) : userData;
  await user.account.add(userData.id, accountData.id, 'owner');
  
  console.log(chalk.green('Account created for: ') + data.email);

  // send welcome email  
  await mail.send({

    to: userData.email,
    template: (req.body.duplicate_user && req.body.has_password) ? 'duplicate-user' : 'new-account',
    content: { name: userData.name }
    
  });

  // authenticate the user
  return await authController.signup(req, res);

};

/*
* account.plan()
* create a new account part 2: plan
*/

exports.plan = async function(req, res){

  const data = req.body;
  const stripeData = {};

  utility.validate(data, ['plan']);
  
  // check the plan exists
  const plan = settings.plans.find(x => x.id === data.plan);
  utility.assert(plan, `Plan doesn't exist`);

  const accountData = await account.get(req.account);
  utility.assert(accountData, 'No account with that ID');

  // process stripe subscription for non-free accounts
  // if a 2-factor payment hasn't occured, create the stripe subscription
  if (data.plan !== 'free'){
    if (data.stripe === undefined){

      utility.assert(data.token?.id, 'Please enter your credit card details');

      // create a stripe customer and subscribe them to a plan
      stripeData.customer = await stripe.customer.create(accountData.owner_email, data.token.id);
      stripeData.subscription = await stripe.customer.subscribe(stripeData.customer.id, data.plan);

      // check for an incomplete payment that requires 2-factor authentication
      if (stripeData.subscription?.latest_invoice?.payment_intent?.status === 'requires_action'){

        console.log(chalk.yellow('Stripe payment requires further action'));

        return res.status(200).send({

          requires_payment_action: true,
          customer: { id: stripeData.customer.id },
          subscription: { id: stripeData.subscription.id, price: stripeData.subscription.price },
          client_secret: stripeData.subscription.latest_invoice.payment_intent.client_secret

        });
      }
    }

    // stripe info hasn't been passed back as part of 2-factor
    if (!data.stripe)
      data.stripe = stripeData;

  }
  else {

    // nullify stripe data on free accounts
    data.stripe = {

      customer: { id: null },
      subscription: { id: null }

    }
  }

  // update the account with plan details
  await account.update(req.account, { 

    plan: data.plan, 
    stripe_customer_id: data.stripe?.customer?.id,  
    stripe_subscription_id: data.stripe?.subscription?.id

  });

  // send email  
  if (data.plan !== 'free'){
    await mail.send({

      to: accountData.owner_email,
      template: 'new_plan',
      content: { 
        
        name: accountData.owner_name, 
        plan: plan.name,
        price: `${plan.currency.symbol}${plan.price}`
      
      }
    });
  }

  console.log(chalk.green('Customer added to plan'));
  log.create('Customer added to plan', { plan: plan }, req);
  res.status(200).send({ plan: data.plan, subscription: 'active', onboarded: false });

}

/*
* account.plan.update()
* upgrade or downgrade the billing plan
*/

exports.plan.update = async function(req, res){

  const data = req.body;
  utility.validate(data, ['plan']);

  const accountID = req.permission === 'master' ? data.id : req.account;
  const plan = settings.plans.find(x => x.id === data.plan);
  utility.assert(plan, 'No plan with that ID');

  const accountData = await account.get(accountID);
  utility.assert(accountData, 'Account does not exist');

  // user is upgrading from paid to free,
  // direct them to the upgrade view
  if (accountData.plan === 'free' && plan.id !== 'free'){

    if (req.permission === 'master'){

      throw ({ message: 'The account holder will need to enter their card details and upgrade to a paid plan.' });

    }
    else {

      return res.status(402).send({ message: 'Please upgrade your account', plan: plan.id });

    }
  }

  if (plan.id === 'free'){

    // user is downgrading - cancel the stripe subscription
    if (accountData.stripe_subscription_id){

      const subscription = await stripe.subscription(accountData.stripe_subscription_id);
      await account.update(req.account, { stripe_subscription_id: null, plan: plan.id });

      if (subscription.status !== 'canceled')
        await stripe.subscription.delete(accountData.stripe_subscription_id);

    }
  }
  else {

    // user is switching to a different paid plan
    if (accountData.stripe_subscription_id){

      // check for active subscription
      let subscription = await stripe.subscription(accountData.stripe_subscription_id);

      if (subscription.status === 'trialing' || subscription.status === 'active'){

        subscription = await stripe.subscription.update(subscription, plan.id);
        await account.update(accountData.id, { plan: plan.id });

      }
      else if (subscription.status === 'canceled'){

        // user previously had a subscription, but is now cancelled - create a new one
        await account.update(req.account, { stripe_subscription_id: null, plan: 'free' });

        return req.permission === 'master' ?
          res.status(500).send({ message: 'The account holder will need to enter their card details and upgrade to a paid plan.' }) :
          res.status(402).send({ message: 'Your subscription was cancelled, please upgrade your account' });

      }
    }
  }

  // notify the user
  await mail.send({

    to: accountData.owner_email,
    template: 'plan-updated',
    content: {

      name: accountData.owner_name,
      plan: plan.name

    }
  });

  // done
  return res.status(200).send({

    message: `Your account has been updated to the ${plan.name} plan`,
    data: { plan: plan.id }

  });
};

/*
* account.get()
* get the account
*/

exports.get = async function(req, res){

  const data = await account.get(req.account);
  return res.status(200).send({ data: data });

}

/*
* account.subscription()
* get the account subscription state
*/

exports.subscription = async function(req, res){

  const subscription = await account.subscription(req.account);

  // format the data 
  if (subscription?.data){

    const start = new Date(subscription.data.current_period_start*1000).toISOString().split('T')[0].split('-');
    const end = new Date(subscription.data.current_period_end*1000).toISOString().split('T')[0].split('-');

    subscription.data = {

      current_period_start: `${start[2]} ${utility.convertToMonthName(start[1])} ${start[0]}`,
      current_period_end: `${end[2]} ${utility.convertToMonthName(end[1])} ${end[0]}`

    };
  }

  return res.status(200).send({ data: {

    status: subscription.status,
    object: subscription.data

  }});
}

/*
* account.upgrade()
* upgrade a free account to paid subscription plan
*/

exports.upgrade = async function(req, res){

  const data = req.body;
  const stripeData = {};
  
  utility.validate(data, ['plan']);

  const newPlanName = settings.plans.find(x => x.id === data.plan).name;
  const accountData = await account.get(req.account);
  utility.assert(accountData, 'Account does not exist');

  if (accountData.stripe_customer_id && accountData.stripe_subscription_id){

    // check if customer & subscription already exists
    stripeData.customer = await stripe.customer(accountData.stripe_customer_id);
    stripeData.subscription = await stripe.subscription(accountData.stripe_subscription_id);

    if (stripeData.customer || stripeData.stripe_subscription_id){

      res.status(500).send({ message: `Your already on the ${accountData.plan} plan.` });
      return false;

    }
  }

  // if a 2-factor payment isn't required, create the stripe subscription
  if (data.stripe === undefined){

    utility.assert(data.token?.id, 'Please enter your credit card details');

    // create a stripe customer and subscribe them to a plan
    stripeData.customer = await stripe.customer.create(accountData.email, data.token.id);
    stripeData.subscription = await stripe.customer.subscribe(stripeData.customer.id, data.plan);

    // check for an incomplete payment that requires 2-factor authentication
    if (stripeData.subscription?.latest_invoice?.payment_intent?.status === 'requires_action'){

      console.log(chalk.yellow('Stripe payment requires further action'));

      res.status(200).send({

        requires_payment_action: true,
        customer: { id: stripeData.customer.id },
        subscription: { id: stripeData.subscription.id, price: stripeData.subscription.price },
        client_secret: stripeData.subscription.latest_invoice.payment_intent.client_secret

      });

      return false;

    }
  }

  // stripe info hasn't been passed back as part of 2-factor
  if (!data.stripe)
    data.stripe = stripeData;

  // update account plan
  await account.update(req.account, {

    plan: data.plan, 
    stripe_customer_id: data.stripe?.customer?.id,  
    stripe_subscription_id: data.stripe?.subscription?.id

  });

  // notify the user
  await mail.send({

    to: accountData.owner_email,
    template: 'plan-updated',
    content: {

      name: accountData.owner_name,
      plan: newPlanName

    }
  });

  // done
  return res.status(200).send({

    message: `Your account has been successfully updated to the ${newPlanName} plan.`,
    data: { plan: data.plan }

  });
};

/*
* account.card()
* get the card details for this account
*/

exports.card = async function(req, res){

  const accountData = await account.get(req.account);
  utility.assert(accountData, 'Account does not exist');

  if (accountData.stripe_customer_id){
    
    const customer = await stripe.customer(accountData.stripe_customer_id);
    card = customer.sources?.data?.[0];

    if (card){
      return res.status(200).send({ data: {

        brand: card.brand,
        last4: card.last4,
        exp_month: card.exp_month,
        exp_year: card.exp_year
    
      }});
    }
    else {

      return res.status(200).send({ data: null });

    }
  }

  return res.status(200).send({ data: null });

}

/*
* account.card.update()
* update credit card defails
*/

exports.card.update = async function(req, res){

  utility.assert(req.body.token, 'Please enter a valid credit card', 'token');
  utility.validate(req.body);

  const accountData = await account.get(req.account);
  utility.assert(accountData, 'Account does not exist');

  const customer = await stripe.customer.update(accountData.stripe_customer_id, req.body.token.id);

  // notify the user
  await mail.send({

    to: accountData.owner_email,
    template: 'card-updated',
    content: { name: accountData.owner_name }

  });

  return res.status(200).send({ 
    
    data: customer?.sources?.data?.[0],
    message: 'Your card details have been updated' 
  
  });
};

/*
* account.invoice()
* return the past invoices for this customer
*/

exports.invoice = async function(req, res){

  let invoices = null;

  const accountData = await account.get(req.account);
  utility.assert(accountData, 'Account does not exist');

  // get the invoices
  if (accountData.stripe_customer_id){

    invoices = await stripe.customer.invoices(accountData.stripe_customer_id);

    // format the invoices
    if (invoices?.data?.length){
      invoices.data = invoices.data.map(invoice => {

        const total = invoice.total;

        return {

          number: invoice.number,
          date: new Date(invoice.created*1000),
          status: invoice.status,
          invoice_pdf: invoice.invoice_pdf,
          total: `${utility.currencySymbol[invoice.currency]}${(total/100).toFixed(2)}`

        }
      })
    }
  }

  return res.status(200).send({ data: invoices?.data });

}


/*
* account.users()
* return the users and invites on this account
*/

exports.users = async function(req, res){

  return res.status(200).send({ data: {

    users: await user.get(null, null, req.account),
    invites: await invite.get(null, null, req.account, true)

  }});
}

/*
* account.close()
* close the account and delete all users associated with it
*/

/*
* account.close()
* close the account and delete all users associated with it
*/

exports.close = async function(req, res){

  // allow master to close account
  const accountId = req.permission === 'master' ? req.params.id : req.account;  
  const accountData = await account.get(accountId);
  utility.assert(accountData, 'Account does not exist');

  if (accountData?.plan !== 'free' && accountData?.stripe_customer_id)
    await stripe.customer.delete(accountData?.stripe_customer_id);

  // get a list of users on this account
  const accountUsers = await user.get(null, null, accountData.id);

  if (accountUsers.length){
    for (u of accountUsers){

      // get the other accounts this user is attached to 
      const userAccounts = await user.account(u.id);
      await token.delete(null, null, u.id);
      
      // user is on multiple accounts
      if (userAccounts.length > 1){

        // unassign user from this acount
        await user.account.delete(u.id, accountData.id); 
        
        // if this account is the user's default account
        // update to prevent a redundant default
        if (u.default_account === accountData.id){

          userAccounts.splice(userAccounts.findIndex(x => x.id === accountId), 1);
          await user.update(u.id, accountId, { default_account: userAccounts[0].id })

        }
      }
      else {

        // delete the user entirely
        await user.delete(u.id, accountData.id);

      }
    }
  }

  // delete the account
  await account.delete(accountData.id);

  await mail.send({

    to: accountData?.owner_email,
    template: 'account-closed',
    content: { name: accountData?.owner_name }

  });

  console.log(chalk.red('Account closed: ') + accountData.owner_email);
  log.create('Account closed', null, req);
  return res.status(200).send({ message: 'Account closed' });

};

/*
* account.plans()
* return available billing plans
*/

exports.plans = async function(req, res){

  const accountData = req.account ? await account.get(req.account) : null;

  return res.status(200).send({
    data: {

      plans: settings.plans,
      active: accountData ? accountData.plan : null,

    }
  });
}
