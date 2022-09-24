#!/usr/bin/env node
const view = require('./view');
const component = require('./component');
const master = require('./master');
const chalk = require('chalk');
const Mocha = require('mocha');
const mocha = new Mocha({});

async function gravity(){

  const args = process.argv.splice(2);
  const command = args[0];

  switch (command){

    case 'create':
    if (args[1] === 'component') component.create(args);
    else if (args[1] === 'master') master.create(args);
    else view.create(args);
    break;

    case 'help':
    showHelp();
    break;

    case 'test':
    runTests();
    break;

    default:
    showHelp();
    break;

  }
}

function showHelp(){

  console.log(chalk.cyan('\nWelcome to the Gravity Toolbelt 🔧 \n'));
  console.log('Usage: gravity <command> \nwhere <command> is one of:\n');
  console.log(chalk.green.bold('\tcreate'));
  console.log(chalk.cyan('\toptions: ') + 'name (name) -ui (optional: create react user interface) -db (optional: create database table & migration)');
  console.log(chalk.cyan('\texample: ') + 'create notification -ui -db');
  console.log('\n');
  console.log(chalk.green.bold('\tcreate component'));
  console.log(chalk.cyan('\toptions: ') + 'name (react component name)');
  console.log(chalk.cyan('\texample: ') + 'create component table');
  console.log('\n');
  console.log(chalk.green.bold('\tcreate master'));
  console.log(chalk.cyan('\toptions: ') + 'email:password (email password combo)');
  console.log(chalk.cyan('\texample: ') + 'create master test@yourdomain.com:yourpassword');
  console.log('\n');
  console.log(chalk.green.bold('\ttest'));
  console.log('\trun unit tests in sequence');
  console.log('\n');
  
  process.exit();

}

async function runTests(){

  mocha.addFile('./test/run');
  mocha.run().on('end', process.exit);

}

gravity();
