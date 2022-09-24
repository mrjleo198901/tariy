const demo = require('../model/demo');

/*
* returns sample data for the demo dashboard
* you can delete this file
*/

exports.revenue = function(req, res){

  const data = demo.revenue();
  return res.status(200).send({ data });

}

exports.users = function(req, res){

  const data = demo.users();
  return res.status(200).send({ data });

}

exports.stats = function(req, res){

  const data = demo.stats();
  return res.status(200).send({ data });

}

exports.progress = function(req, res){

  const data = demo.progress();
  return res.status(200).send({ data });

}

exports.users.types = function(req, res){

  const data = demo.users.types();
  return res.status(200).send({ data });

}
