const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();
const config = require('./config');

chai.use(chaiHttp);

// invite a user to the account
describe('POST /invite', () => {
  it ('should create a new user invite', done => {

    chai.request(server)
    .post('/api/invite')
    .set(config.auth, process.env.token)
    .send({ email: config.user.email, permission: 'user' })
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.should.be.an('array');
      process.env.invite = res.body.data[0].id;
      done();

    });
  }).timeout(config.timeout);
});

// create a new user
describe('POST /user', () => {
  it ('should create a new user', done => {

    config.user.invite_id = process.env.invite;

    chai.request(server)
    .post('/api/user')
    .send(config.user)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.token.should.be.a('string');
      res.body.plan.should.be.a('string');
      res.body.name.should.be.a('string');
      process.env.user_token = 'Bearer ' + res.body.token;
      delete config.user.invite_id;
      done();

    });
  }).timeout(config.timeout)
});

// authenicate the user
describe('POST /auth', () => {
  it ('should return token and user data', done => {

    chai.request(server)
    .post('/api/auth')
    .send(config.user)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.token.should.be.a('string');
      res.body.plan.should.be.a('string');
      res.body.name.should.be.a('string');
      res.body.subscription.should.be.a('string');
      process.env.user_token = 'Bearer ' + res.body.token;
      done();

    });
  }).timeout(config.timeout);
});

// get the user
describe('GET /user', () => {
  it ('should return the user', done => {

    chai.request(server)
    .get('/api/user')
    .set(config.auth, process.env.user_token)
    .send()
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.id.should.be.a('string');
      res.body.data.email.should.be.a('string');
      res.body.data.account_id.should.be.a('string');
      done();

    });
  }).timeout(config.timeout);
});

// get list of permissons
describe('GET /user/permissions', () => {
  it ('should return a list of available user permission levels', done => {

    chai.request(server)
    .get('/api/user/permissions')
    .set(config.auth, process.env.user_token)
    .send()
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.should.be.an('object');
      done();

    });
  });
});

// update the user
describe('PATCH user', () => {
  it ('should update the user', done => {

    chai.request(server)
    .patch('/api/user')
    .set(config.auth, process.env.user_token)
    .send({ name: 'New User' })
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout);
});

// update the password
describe('PATCH user/password', () => {
  it ('should update the users password', done => {

    chai.request(server)
    .put('/api/user/password')
    .set(config.auth, process.env.user_token)
    .send({ newpassword: config.user.newpassword, oldpassword: config.user.password })
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout);
});

// trigger a password reset email
describe ('POST /auth/password/reset/request', () => {
  it ('should trigger a password reset email', done => {

    chai.request(server)
    .post('/api/auth/password/reset/request')
    .send({ email: config.user.email })
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout);
});

// update the push token
describe('PUT /pushtoken', () => {
  it ('should update the user\'s push token', done => {

    chai.request(server)
    .put('/api/pushtoken/')
    .set(config.auth, process.env.user_token)
    .send({ push_token: 'TEST' })
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout);
});