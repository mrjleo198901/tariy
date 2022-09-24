const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();
const config = require('./config');

chai.use(chaiHttp);

// create a new feedback item
describe('POST /feedback', () => {
  it ('should save a new feedback item', done => {

    chai.request(server)
    .post('/api/feedback')
    .set(config.auth, process.env.token)
    .send({ rating: 'positive', comment: 'Testing feedback' })
    .end((err, res) => {

      res.should.have.status(200);
      process.env.feedback_id = res.body.data.id;
      done();

    });
  }).timeout(config.timeout);
});
