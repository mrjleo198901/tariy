const {{view}} = require('../model/{{view}}');

exports.create = async function(req, res){

  const data = await {{view}}.create(req.body, req.account);
  res.status(200).send({ message: '{{view}} created', data: data });

}

exports.get = async function(req, res){

  const data = await {{view}}.get(req.params.id, req.account);
  res.status(200).send({ data: data });

}

exports.update = async function(req, res){

  await {{view}}.update(req.params.id, req.body, req.account);
  res.status(200).send({ message: '{{view}} updated', data: req.body });

}

exports.delete = async function(req, res){

  await {{view}}.delete(req.params.id, req.account);
  res.status(200).send({ message: '{{view}} deleted' });

}
