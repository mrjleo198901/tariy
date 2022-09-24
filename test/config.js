const config = require('config');
const stripe = config.get('stripe');
const password = '7(6>7237@[442$^6';

const testFree =
  stripe.plans && stripe.plans.length &&
    stripe.plans.findIndex(x => x.id === 'free');

const testPaid =
  stripe.plans && stripe.plans.length &&
    stripe.plans.findIndex(x => x.id !== 'free');

module.exports = {

  test: {

    free: testFree >= 0 ? true : false,
    paid: testPaid  >= 0 ? true : false,

  },

  stripe: stripe,
  timeout: 30000,
  auth: 'authorization',

  account: {

    free: { name: 'Free Test', email: `free_${process.env.SUPPORT_EMAIL}`, password: password, plan: 'free' },
    paid: { name: 'Paid Test', email: `paid_${process.env.SUPPORT_EMAIL}`, password: password, plan: testPaid >= 0 && stripe.plans[testPaid].id  }

  },
  user: {

    name: 'New User',
    email: `user_${process.env.SUPPORT_EMAIL}`,
    password: password,
    newpassword: password+1,
    permission: 'user',
    push_token: 'ExponentPushToken[679639]'

  },
  key: {

    name: 'Test API Key',
    scope: ['account.read', 'user.read']

  },
  event: {

    name: 'Test Event',
    metadata: { test_name: 'Integration test' }

  }
}
