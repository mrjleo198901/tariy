const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const {{view}}Schema = new Schema({

  account_id: { type: String, required: true },

});

const {{view}} = mongoose.model('{{view}}', {{view}}Schema, '{{view}}');
exports.schema = {{view}};

exports.create = async function(data, account){

  const new{{view}} = {{view}}({

    id: uuidv4(),
    account_id: account,

  });

  data = await new{{view}}.save();
  return data.id;

}

exports.get = async function(id, account){

  return await {{view}}.find({

    ...id && { id: id },
    account_id: account

  });
}

exports.update = async function(id, data, account){

  await {{view}}.findOneAndUpdate({ id: id, account_id: account }, data);
  return data;

}

exports.delete = async function(id, account){

  await {{view}}.findOneAndRemove({ id: id });
  return id;

}
