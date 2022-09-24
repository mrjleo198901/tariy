const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();
const config = require('./config');

chai.use(chaiHttp);

// create a new api key
describe('POST /key', () => {
  it ('should create a new API key', done => {

    chai.request(server)
    .post('/api/key')
    .set(config.auth, process.env.token)
    .send(config.key)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.key.should.be.a('string');
      res.body.data.full_key.should.be.a('string');
      res.body.data.scope.should.be.an('array');
      process.env.key_id = res.body.data.id;
      process.env.full_key = res.body.data.full_key;
      done();

    });
  }).timeout(config.timeout);
});

// use the API key
describe('GET /account/users', () => {
  it ('should test that the API key can GET accounts', done => {

    chai.request(server)
    .get('/api/account/users')
    .set(config.auth, 'Basic ' + process.env.full_key)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.users.should.be.an('array');
      done();

    });
  }).timeout(config.timeout);
});

// get a list of API keys
describe('GET /key', () => {
  it ('should list the API keys', done => {

    chai.request(server)
    .get('/api/key')
    .set(config.auth, process.env.token)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.should.be.an('array');
      done();

    });
  }).timeout(config.timeout);
});


// get a single API key
describe('GET /key/:id', () => {
  it ('should return a single API key', done => {

    chai.request(server)
    .get('/api/key/' + process.env.key_id)
    .set(config.auth, process.env.token)
    .end((err, res) => {

      res.should.have.status(200);
      res.body.data.should.be.an('array');
      res.body.data.should.have.length(1);
      done();

    });
  }).timeout(config.timeout);
});

// update an api key scope
describe('PATCH /key', () => {
  it ('should update an API keys scope', done => {

    chai.request(server)
    .patch('/api/key/' + process.env.key_id)
    .send({ scope: ['billing.read' ]})
    .set(config.auth, process.env.token)
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout)
});

// delete an api key
describe('DELETE /key/', () => {
  it ('should delete an API key', done => {

    chai.request(server)
    .delete('/api/key/' + process.env.key_id)
    .set(config.auth, process.env.token)
    .end((err, res) => {

      res.should.have.status(200);
      done();

    });
  }).timeout(config.timeout)
});
