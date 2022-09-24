/*
********************************************************
* manual setup flow for native client without ui wizard
********************************************************/

const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');
const randomstring = require('randomstring');
const app = '../../app';

async function getNetworkAddress(){

  // get the local network address
  // and add this to the expo config file
  var addresses = [];
  const interfaces = os.networkInterfaces();

  for (let k in interfaces){
    for (let k2 in interfaces[k]) {

      var address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal){
        addresses.push(address.address);
      }
    }
  }

  const config = require(`${app}/config.json`);
  config.baseURL = 'http://' + addresses[0] + ':8080';

  await fs.writeFile(`../app/config.json`, JSON.stringify(config, null, ' '));
  console.log('Set API base URL to local IP 👍');
  return;

}

async function setupSQLDatabase(){

  const db = require('../model/knex')();
  await db.migrate.latest();

  // move model files to root folder
  const files = await fs.readdir('./model/sql');

  for (file of files)
    await fs.copyFile(`./model/sql/${file}`, `./model/${file}`);
 
  console.log('MySQL tables created');
  return;

};

async function setupMongoDatabase(){

  // inject the mongo script into the server file
  let server = await fs.readFile('./server.js', 'utf8');
  server = server.split('\n');

  const requireString = "const mongo = require('./model/mongo');";
  const sanitiseRequireString = "const mongoSanitize = require('express-mongo-sanitize');";
  const awaitString = '  await mongo.connect();';
  const sanitiseString = "// mongo sanitise \napp.use(mongoSanitize());\n"

  // inject mongo
  if (!server.includes(requireString))
    server.splice(server.indexOf(''), 0, requireString);

  if (!server.includes(awaitString)){

    const index = server.indexOf("const server = app.listen(port, async () => {");
    server.splice(index+3, 0, awaitString);

  }

  // inject mongo sanitization package
  if (!server.includes(sanitiseRequireString))
    server.splice(server.indexOf(''), 0, sanitiseRequireString);

  if (!server.includes(sanitiseString)){

    const index = server.indexOf('app.use(express.urlencoded({ extended: true }));');
    server.splice(index+2, 0, sanitiseString);

  }

  // write the file
  server = server.join('\n');
  await fs.writeFile('./server.js', server);
  
  // move model files to root folder
  const files = await fs.readdir('./model/mongo');

  // move the template
  await fs.copyFile('./template/mongo/model.js', './template/model.js');
  
  for (file of files)
    await fs.copyFile(`./model/mongo/${file}`, `./model/${file}`);

  // remove knex file
  fs.unlink('./model/knex.js');
  return;

}

async function createEnv(){

  await updateEnv('SESSION_SECRET', randomstring.generate(64));
  await updateEnv('CRYPTO_SECRET', randomstring.generate(64));
  await updateEnv('TOKEN_SECRET', randomstring.generate(64));

}

async function setup(){

  try {

    let db = process.argv[2];

    await getNetworkAddress();

    // if there's no web client, setup the app
    if (!fsSync.existsSync('../client')){

      await createEnv();
   
      // setup db
      db = db ? db.substring(db.indexOf(':') + 1) : 'mysql2';
      await updateEnv('DB_CLIENT', db);

      if (db === 'mongo'){

        await setupMongoDatabase();
        await cleanPackage(null, ['mysql', 'knex']); // clean package.json

      }
      else {

        await setupSQLDatabase();
        await cleanPackage(null, ['mongodb', 'mongoose', 'express-mongo-sanitize']); // clean package.json

      }
    }

    process.exit();

  }
  catch (err){

    console.error(err);

  }
}

/*
* setup.settings()
* update the env file
*/

async function updateEnv(key, value){

  let didUpdate = false;
  let file = await fs.readFile('./.env', 'utf8');
  file = file.split('\n');

  // edit existing key
  if (file.length){
    file.forEach((line, index) => {
      if (line.includes(key)){

        file[index] = `${key}=${value}`;
        didUpdate = true;

      }
    });

    // create a new key
    if (!didUpdate){

      file.push(`${key}=${value}`)

    }

    file = file.join('\n');
    await fs.writeFile('./.env', file);

  }

  return;

}

async function cleanPackage(add, remove){

  let package = require('../package.json');

  remove.forEach(key => {
    if (package.dependencies.hasOwnProperty(key)){

      delete package.dependencies[key];

    }
  });

  await fs.writeFile('package.json', JSON.stringify(package, null, ' '));
  return;
  
}

setup();
