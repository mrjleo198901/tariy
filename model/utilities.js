const config = require('config');

exports.convertToMonthName = function(month){

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May',
  'Jun', 'Jul','Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return monthNames[month-1];

}

exports.getBillingPlanDetails = function(planId){

  let planObj = settings.plans.find(planObj => planObj.id == planId);
  return planObj;

}

exports.validate = function(form, fields){

  // sanitise the input
  Object.keys(form).forEach(f => {

    // sanitise
    if (typeof form[f] === 'string' && form[f]?.includes('<script>')){

      form[f] = form[f].replace('<script>', '');
      form[f] = form[f].replace('</script>', '');

    }
  });

  if (fields?.length){
    fields.forEach((f, i) => {    
      if (!form.hasOwnProperty(f) || !form[f]){

        // field is required
        throw { message: f + ' field is required' };

      }
    });
  }
}

exports.assert = function(data, err, input){

  if (!data)
    throw { message: err, ...input && { inputError: input }};

  return true;

}

exports.base64 = {};

exports.base64.encode = function(data){

  return Buffer.from(data).toString('base64');

}

exports.base64.decode = function(data){

  return Buffer.from(data, 'base64').toString('utf-8');

}

exports.dedupeArray = function(arr){
  return arr.filter(function(elem, index, self){

    return index === self.indexOf(elem);

  });
}

exports.currencySymbol = {

  usd: '$',
  gbp: '£',
  eur: '€',
  aud: '$',
  cad: '$'

}

exports.mask = function(s){

  return `${s.slice(0, 3)}...${s.slice(s.length-3, s.length)}`;

}

exports.validateNativeURL = function(url, scheme){

  return url && (url.includes('exp://') || url.includes(`${scheme}://`)) ? url : false;

}