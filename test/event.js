const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();
const config = require('./config');

chai.use(chaiHttp);

// create a new api key
describe('POST /event', () => {
  it ('should create a new event', done => {

    chai.request(server)
    .post('/api/event')
    .set(config.auth, process.env.token)
    .send(config.event)
    .end((err, res) => {

      res.should.have.status(200);
      process.env.event_id = res.body.data.id;
      done();

    });
  }).timeout(config.timeout);
});