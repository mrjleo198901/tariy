require('dotenv').config();
const chalk = require('chalk');
const user = require('../model/user');
const account = require('../model/account');

exports.create = async function(args){

  // create a new master account

  if (!args[2]){

    console.log(chalk.red('Please specify an email and password, eg. email@domain.com:password12345'))

  }

  const data = { 

    email: args[2].split(':')[0],
    password: args[2].split(':')[1]

  }

  try {

    let userData = await user.get(null, data.email);
    if (userData) throw { message: 'You have already registered an account with this email' };

    // create the account and user
    const accountData = await account.create();
    await account.update(accountData.id, { plan: 'master', name: 'Master' });

    userData = await user.create({ name: 'Master', email: data.email, password: data.password }, accountData.id);
    await user.account.add(userData.id, accountData.id, 'master');

    console.log(chalk.green('Master account created'));
    process.exit();

  }
  catch (err){

    console.log(err);

  }
}
