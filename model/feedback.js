const db = require('./knex')();
const { v4: uuidv4 } = require('uuid');

/*
* feedback.create()
* save a new feedback rating plus comment
*/

exports.create = async function(data, user){

  data.id = uuidv4();
  data.user_id = user;
  await db('feedback').insert(data);
  return data;

}

/*
* feedback.get()
* list feedback items
*/

exports.get = async function(id){

  const cols = ['feedback.id', 'rating', 'comment', 'user.email'];

  return await db('feedback').select(cols)
  .join('user', 'user_id', 'user.id')
  .modify(q => {

    id && q.whereIn('feedback.id', id.split(','));

  });
}

/*
* feedback.metrics()
* sum ratings by group
*/

exports.metrics = async function(){

  const data = await db('feedback').select('*').from('feedback');

  return {
    
    positive: data.filter(x => x.rating === 'positive').length,
    neutral: data.filter(x => x.rating === 'neutral').length,
    negative: data.filter(x => x.rating === 'negative').length

  } 
}


/*
* feedback.delete()
* delete a feedback item
*/

exports.delete = async function(id){

  await db('feedback').del().where({ id: id });
  return id;

}
