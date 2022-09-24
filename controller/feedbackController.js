const config = require('config');
const feedback = require('../model/feedback');
const mail = require('../model/mail');
const utility = require('../model/utilities');

exports.create = async function(req, res){

  utility.validate(req.body, ['rating', 'comment']);
  const data = await feedback.create(req.body, req.user);

  await mail.send({

    to: process.env.SUPPORT_EMAIL,
    template: 'feedback',
    content: {
  
      rating: req.body.rating,
      comment: req.body.comment,
  
    }
  });

  res.status(200).send({ data: data });

}

exports.get = async function(req, res){

  const data = await feedback.get();
  res.status(200).send({ data: data });

}

exports.metrics = async function(req, res){

  const data = await feedback.metrics();
  res.status(200).send({ data: data });

}

exports.delete = async function(req, res){

  await feedback.delete(req.params.id);
  res.status(200).send({ message: 'Feedback item deleted' });

}
