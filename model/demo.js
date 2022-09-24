const chart = require('./chart.js');

/*
* returns sample data for the demo dashboard
* you can delete this file
*/

exports.revenue = function revenue(){

  const year1 = new Date().getFullYear()-2;
  const year2 = new Date().getFullYear()-1;

  const labels = [`${year1} Revenue`, `${year2} Revenue`];
  const data = [[

    { label: 'jan', value: 24846 },
    { label: 'feb', value: 28464 },
    { label: 'mar', value: 31375 },
    { label: 'apr', value: 35312 },
    { label: 'may', value: 32716 },
    { label: 'jun', value: 36746 },
    { label: 'jul', value: 39474 },
    { label: 'aug', value: 43756 },
    { label: 'sep', value: 49790 },
    { label: 'oct', value: 53744 },
    { label: 'nov', value: 58376 },
    { label: 'dec', value: 64232 }

  ],
  [

    { label: 'jan', value: 64232 },
    { label: 'feb', value: 64647 },
    { label: 'mar', value: 56338 },
    { label: 'apr', value: 55347 },
    { label: 'may', value: 54462 },
    { label: 'jun', value: 62374 },
    { label: 'jul', value: 66334 },
    { label: 'aug', value: 69573 },
    { label: 'sep', value: 71464 },
    { label: 'oct', value: 69464 },
    { label: 'nov', value: 75474 },
    { label: 'dec', value: 78757 }

  ]]

  return chart.create(data, labels);

}

exports.users = function users(){

  return [
    { id: 1, name: 'Joseph Sandoval', email: 'joseph_88@example.com', plan: 'startup', created: '11 Apr 2019' },
    { id: 2, name: 'Alan Reed', email: 'alan_reed@example.com', plan: 'startup', created: '09 Apr 2019' },
    { id: 3, name: 'Maria Sanchez', email: 'maria_86@example.com', plan: 'startup', created: '11 Apr 2019' },
    { id: 4, name: 'Gloria Gordon', email: 'gloria-89@example.com', plan: 'startup', created: '09 Apr 2019' },
    { id: 5, name: 'Daniel Guerrero', email: 'daniel-88@example.com', plan: 'enterprise', created: '08 Apr 2019' },
    { id: 6, name: 'Amanda Walsh', email: 'amanda.walsh@example.com', plan: 'enterprise', created: '07 Apr 2019' },
    { id: 7, name: 'Jose Hall', email: 'jose_hall@example.com', plan: 'enterprise', created: '07 Apr 2019' },
    { id: 8, name: 'Ethan Russell', email: 'ethan_86@example.com', plan: 'enterprise', created: '07 Apr 2019' },
    { id: 9, name: 'Nicole Barnett', email: 'nicole87@example.com', plan: 'enterprise', created: '06 Apr 2019' }
  ]
}


exports.users.types = function userTypes(){

  const labels = 'User';
  const data = [

    { label: 'Owner', value: 7233 },
    { label: 'Admin', value: 321 },
    { label: 'User', value: 2101 }

  ];

  return chart.create(data, labels);

}

exports.stats = function stats(){

  return({

    users: 9655,
    active: 9173,
    churned: 482,
    latest: 231

  });
}

exports.progress = function progress(){

  return([
    { label: '$100k MMR', value: '75%' },
    { label: '10k users', value: '90%' },
    { label: '2% churn', value: '40%' },
    { label: '2,500 teams', value: '20%' },
    { label: 'Ship new product', value: '78%' }
  ]);
}
