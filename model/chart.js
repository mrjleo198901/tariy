/*
* create a new chart object
* accepts a dataset comprised of an object with label/value keys
* and array of labels for each dataset
* see model/demo.js for an example
*/

exports.create = function(datasets, labels){

  if (!Array.isArray(datasets[0]))
  datasets = [datasets];

  if (!Array.isArray(labels))
  labels = [labels];

  let chart = {

    labels: null,
    datasets: [],

  };

  // for each dataset
  if (datasets){
    for (i = 0; i < datasets.length; i++){

      let values = [], ticks = [];

      for (j = 0; j < datasets[i].length; j++){

        ticks.push(datasets[i][j].label);
        values.push(datasets[i][j].value);

      }

      chart.labels = ticks;
      chart.datasets.push({

        label: labels[i],
        data: values

      })
    }
  }

  return chart;

}
