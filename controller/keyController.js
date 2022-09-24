const config = require('config');
const key = require('../model/key');
const crypto = require('crypto');
const utility = require('../model/utilities');

exports.create = async function(req, res){

  let data = req.body
  utility.validate(data, ['name', 'scope']);

  // generate a unique key
  do data.key = 'key-' + crypto.randomBytes(32).toString('hex');
  while (!(await key.unique(data.key)));

  // save the key
  data = await key.create(data, req.account);
  res.status(200).send({ message: 'API key created', data: data });
  
}

exports.get = async function(req, res){

  const data = await key.get(req.params.id, null, req.account);
  res.status(200).send({ data: data });

}

exports.scopes = async function(req, res){

  res.status(200).send({ data: config.get('api_scopes') });

}

exports.update = async function(req, res){

  utility.validate(req.body);
  await key.update(req.params.id, req.body, req.account);
  res.status(200).send({ message: 'API key updated' });

}

exports.delete = async function(req, res){

  await key.delete(req.params.id, req.account);
  res.status(200).send({ message: 'API key deleted' });

}