const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./user').schema;

// define schema
const EventSchema = new Schema({

  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  metadata: { type: Object },
  time: { type: Date, required: true },
  user_id: { type: String },
  account_id: { type: String },

});

const Event = mongoose.model('Event', EventSchema, 'event');

/*
* event.create()
* create a new event
*/

exports.create = async function(data, user, account){

  data.id = uuidv4();
  data.user_id = user;
  data.account_id = account;
  data.time = new Date();

  const newEvent = Event(data);
  await newEvent.save();
  return data;

}