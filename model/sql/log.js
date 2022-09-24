const db = require('./knex')();
const mail = require('./mail');
const { v4: uuidv4 } = require('uuid');

/*
* log.create()
* create a new log
* method, endpoint, user_id and account_id will be extracted from the req object 
* pass user, account IDs if not available in req
* message is a string, body can be used for a string or object
*/

exports.create = async function(message, body, req, sendNotification, user, account){ 

  const data = {

    id: uuidv4(),
    message: message,
    user_id: req?.user || user,
    account_id: req?.account || account,
    endpoint: req?.route?.path,
    body: body && (typeof body === 'object' ? JSON.stringify(body, Object.getOwnPropertyNames(body)) : body),
    method: req ? Object.keys(req.route.methods).reduce(key => { 
      
      return req.route.methods[key] 
    
    }) : null,
  }

  await db('log').insert(data);

  if (sendNotification){
    mail.send({ 
      
      to: process.env.SUPPORT_EMAIL, 
      template: 'new-log', 
      content: { id: data.id }
      
    });
  }

  return data;

}
