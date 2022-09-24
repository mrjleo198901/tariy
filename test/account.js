const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();
const config = require('./config');

chai.use(chaiHttp);

// create a new free account
config.test.free &&
describe('POST /account', () => {
  it ('should create a new free account', done => {

    chai.request(server)
    .post('/api/account')
    .send(config.account.free)
    .end((err, res) => {

      const account = res.body;
      res.should.have.status(200);
      account.token.should.be.a('string');
      process.env.free_token = 'Bearer ' + account.token;
      done();

    });
  }).timeout(config.timeout);
});

// create a new paid account
config.test.paid &&
describe('POST /account', () => {
  it ('should create a new paid account', done => {

    chai.request(server)
    .post('/api/account')
    .send(config.account.paid)
    .end((err, res) => {

      const account = res.body;
      res.should.have.status(200);
      account.token.should.be.a('string');
      process.env.token = 'Bearer ' + account.token;
      done();

    });
  }).timeout(config.timeout)
});

// select a free plan
config.test.free &&
describe('POST /account/plan', () => {
  it ('should return active subscription state', done => {

    chai.request(server)
    .post('/api/account/plan')
    .set(config.auth, process.env.free_token)
    .send(config.account.free, process.env.free_token)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.plan.should.be.a('string');
      res.body.subscription.should.be.a('string');
      res.body.onboarded.should.eq(false);
      done();

    });
  }).timeout(config.timeout)
});

// test 3d secure payment
config.test.paid &&
describe('POST /account/plan', () => {
  it ('should return payment requires further action', done => {

    config.account.paid.token = { id: 'tok_threeDSecure2Required' };

    chai.request(server)
    .post('/api/account/plan')
    .set(config.auth, process.env.token)
    .send(config.account.paid)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.requires_payment_action.should.eq(true);
      res.body.customer.id.should.be.a('string');
      res.body.subscription.id.should.be.a('string');
      res.body.client_secret.should.be.a('string');
      done();

    });
  }).timeout(config.timeout)
});

// select a paid plan
config.test.paid &&
describe('POST /account/plan', () => {
  it ('should select a paid plan and make a payment', done => {

    config.account.paid.token = { id: 'tok_visa' };

    chai.request(server)
    .post('/api/account/plan')
    .set(config.auth, process.env.token)
    .send(config.account.paid)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.plan.should.eq(config.account.paid.plan);
      res.body.subscription.should.eq('active');

      // cleanup
      delete config.account.paid.token;
      done();

    });
  }).timeout(config.timeout);
});

// get the auth status
describe('GET /auth', () => {
  it ('should return the auth status', done => {

    chai.request(server)
    .get('/api/auth')
    .set(config.auth, process.env.token)
    .send()
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.jwt_token.should.be.a('boolean');
      res.body.data.social_token.should.be.a('boolean');
      res.body.data.subscription.should.be.a('string');
      res.body.data.authenticated.should.be.a('boolean');
      done();

    });
  }).timeout(config.timeout);
});

// get subscription
config.test.paid &&
describe('GET /account/subscription', () => {
  it ('should return the stripe subscription', done => {

    chai.request(server)
    .get('/api/account/subscription')
    .set(config.auth, process.env.token)
    .send()
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.status.should.be.a('string');
      res.body.data.object.should.be.an('object');
      done();

    });
  }).timeout(config.timeout);
});

// get the plans
describe('GET /account/plans', () => {
  it ('should return available billing plans', done => {

    chai.request(server)
    .get('/api/account/plans')
    .send()
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.plans.should.be.an('array');
      done();

    });
  });
});

// update the paid plan
config.test.paid &&
describe('PATCH /account/plan', () => {
  it ('should update the billing plan', done => {

    chai.request(server)
    .patch('/api/account/plan')
    .set(config.auth, process.env.token)
    .send({ plan: config.stripe.plans[1].id })
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout);
});

// downgrade to free
config.test.free &&
describe('PATCH /account/plan', () => {
  it ('should downgrade to the free plan', done => {

    chai.request(server)
    .patch('/api/account/plan')
    .set(config.auth, process.env.token)
    .send({ plan: 'free' })
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout);
});

// upgrade to paid
config.test.free &&
config.test.paid &&
describe ('POST /account/upgrade', () => {
  it ('should upgrade to the paid plan', done => {

    config.account.paid.token = { id: 'tok_visa' };

    chai.request(server)
    .post('/api/account/upgrade')
    .set(config.auth, process.env.free_token)
    .send(config.account.paid)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.plan.should.be.a('string');
      delete config.account.paid.token;
      done();

    });
  }).timeout(config.timeout);
});

// get the credit card
describe('GET /account/card', () => {
  it ('should return the auth status', done => {

    chai.request(server)
    .get('/api/account/card')
    .set(config.auth, process.env.token)
    .send()
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.brand.should.be.a('string');
      res.body.data.last4.should.be.a('string');
      res.body.data.exp_month.should.be.a('number');
      res.body.data.exp_year.should.be.a('number');
      done();

    });
  }).timeout(config.timeout);
});

// update the credit card
config.test.paid &&
describe('PATCH /account/card', () => {
  it ('should return the card details', done => {

    chai.request(server)
    .get('/api/account/card')
    .set(config.auth, process.env.token)
    .send({ token: 'tok_visa' })
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout);
});

// get past invoices
describe('GET /account/invoice', () => {
  it ('should return past invoices', done => {

    chai.request(server)
    .get('/api/account/invoice')
    .set(config.auth, process.env.token)
    .send()
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.should.be.an('array');
      done();

    });
  }).timeout(config.timeout);
});

// get all users on an account
describe('GET /account/users', () => {
  it ('should return all users on the account', done => {

    chai.request(server)
    .get('/api/account/users')
    .set(config.auth, process.env.token)
    .send()
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.users.should.be.an('array');
      res.body.data.users.should.have.length.above(0);
      done();

    });
  }).timeout(config.timeout);
});
