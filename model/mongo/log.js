const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const randomstring = require('randomstring');
const Schema = mongoose.Schema;

// define schema
const LogSchema = new Schema({

  id: { type: String, required: true, unique: true },
  time: { type: Date, required: true },
  message: { type: String },
  body: { type: String },
  method: { type: String },
  endpoint: { type: String },
  account_id: { type: String },
  user_id: { type: String }

});

const Log = mongoose.model('Log', LogSchema, 'log');

/*
* log.create()
* create a new log
* method, endpoint, user_id and account_id will be extracted from the req object 
* pass user, account IDs if not available in req
* message is a string, body can be used for a string or object
*/

exports.create = async function(message, body, req, user, account){

  const newLog = Log({

    id: uuidv4(),
    message: message,
    time: new Date(),
    user_id: req?.user || user,
    account_id: req?.account || account,
    endpoint: req?.route?.path,
    body: body && (typeof body === 'object' ? JSON.stringify(body, Object.getOwnPropertyNames(body)) : body),
    method: req ? Object.keys(req.route.methods).reduce(key => { 
      
      return req.route.methods[key] 
    
    }) : null,
  });

  return await newLog.save();

}