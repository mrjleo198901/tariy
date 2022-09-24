const event = require('../model/event');
const chart = require('../model/chart');
const utility = require('../model/utilities');

exports.create = async function(req, res){

  if (process.env.STORE_EVENT_LOGS === 'true'){
    
    utility.validate(req.body, ['name']);
    const data = await event.create(req.body, req.user, req.account);
    return res.status(200).send({ message: 'Event created', data: data });

  }

  res.status(200);

}

exports.get = async function(req, res){

  const list = await event.get(req.params.id, req.query);

  if (req.query.name){

    // create a chart
    let chartData;
    const times = await event.times(req.query.name);

    if (times?.length){
      chartData = times.map(x => {
        return {

          label: x.time,
          value: x.total
          
        }
      });
    }
       
    return res.status(200).send({ data: { 

      list: list,
      chart: chartData ? chart.create(chartData) : null

    }});
  }

  res.status(200).send({ data: list });

}

exports.delete = async function(req, res){

  await event.delete(req.params.id);
  res.status(200).send({ message: 'Event deleted' });

}
