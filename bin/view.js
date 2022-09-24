require('dotenv').config();
const fs = require('fs').promises;
const chalk = require('chalk');
const client = '../client';
const app = '../app';

exports.create = async function(args){

  const name = args[1];
  const isMongo = process.env.DB_CLIENT === 'mongo' ? true : false;
  const capitalisedName = name.charAt(0).toUpperCase() + name.slice(1);

  if (args[1].includes('-')){

    console.log(chalk.red('Please provide a name as the first argument'));
    return false;

  }

  try {

    // create the model, controller and api endpoints
    const template = isMongo ? 'mongo/model' : 'sql/model';
    await createFile(template, name, './model/' + name + '.js');
    await createFile('controller', name, './controller/' + name + 'Controller.js');
    await createFile('api', name, './api/' + name + '.js');
    await importAPI(name);

    // create the ui (optional)
    if (args.indexOf('-ui') > -1){

      try {

        await fs.access(client);
        await createFile('view-web', name, `${client}/src/views/` + name + '.js', capitalisedName);
        await createReactRoute(name, capitalisedName);

      }
      catch (err){}

      try {

        await fs.access(app);
        await createFile('view-native', name, `${app}/views/` + name + '.js', capitalisedName);

      } catch (err) {}
    }

    // create datebase (optional)
    if (args.indexOf('-db') > -1 && !isMongo){

      await createDatabase(name);

    }

    console.log(chalk.green(name + ' created 👍'));
    process.exit();

  }
  catch (err){

    console.log(chalk.red('Error: ' + err));
    process.exit();

  }
}

async function createFile(templateName, viewName, path, capitalisedName){

  const template = './template/' + templateName + '.js';
  let file = await fs.readFile(template, 'utf8');
  file = file.replace(/{{view}}/g, viewName);
  file = file.replace(/{{capitalisedName}}/g, capitalisedName);
  await fs.writeFile(path, file, { flag: 'wx' });
  return;

}

async function createReactRoute(routeName, viewName){

  const router = `${client}/src/routes/app.js`;

  let file = await fs.readFile(router, 'utf8')
  file = file.split('\n');

  const importer = `import { ${viewName} } from 'views/${routeName}';`

  const route =
      `  {
    path: '/${routeName}',
    view: ${viewName},
    layout: 'app',
    permission: 'user',
    title: '${viewName}'
  },`

  // inject
  file.splice(0, 0, importer);
  file.splice(file.indexOf(']'), 0, route);
  file = file.join("\n");

  await fs.writeFile(router, file);
  return;
  
}

async function importAPI(name){

  const filename = './api/index.js';
  let file = await fs.readFile(filename, 'utf8');

  const str = "require('./" + name + "'),";
  file = file.split('\n');

  // check for duplicate
  if (file.indexOf(str) > -1)
    throw name + '.js is already imported into ./api/index.js';

  const index = file.indexOf('];');
  file.splice(index-1, 0, str);
  file = file.join("\n");

  await fs.writeFile(filename, file);
  return;

}

async function createDatabase(viewName){

  const db = require('../model/knex')();
  const res = await db.migrate.make(viewName, { stub: 'template/migration.js' });
  const filename = res.substring(res.indexOf('migrations/'));
  
  // inject table table
  let file = await fs.readFile(filename, 'utf8');
  file = file.replace(/{{view}}/g, viewName);
  await fs.writeFile(filename, file);

  // migrate
  await db.migrate.latest();
  return true;

}
