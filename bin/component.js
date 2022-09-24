const fs = require('fs').promises;
const chalk = require('chalk');
const client = '../client';

exports.create = async function(args){

  const name = args[2];
  const capitalisedName = name.charAt(0).toUpperCase() + name.slice(1);

  const dir = `${client}/src/components/${name}`;

  // create a new folder in src/app/components 
  await fs.mkdir(dir);
  await createFile('react.js', name, capitalisedName, `${dir}/${name}.js`);
  await createFile('style.scss', name, capitalisedName, `${dir}/${name}.module.scss`);

  // link to lib
  await link(name, capitalisedName);
  console.log(chalk.green(name + ' created 👍'));

}

async function createFile(template, name, capitalisedName, path){

  template = `./template/component/${template}`;
  let file = await fs.readFile(template, 'utf8');
  file = file.replace(/{{name}}/g, name);
  file = file.replace(/{{capitalisedName}}/g, capitalisedName);
  await fs.writeFile(path, file, { flag: 'wx' });
  return;

}

async function link(name, capitalisedName){

  const filename = `${client}/src/components/lib.js`;
  const str = `export { ${capitalisedName} } from './${name}/${name}.js'`;
  let file = await fs.readFile(filename, 'utf8');

  file = file.split('\n');

  // // check for duplicate
  if (file.indexOf(str) > -1)
    throw name + `${name} is already imported`;

  file.splice(file.length + 1, 0, str);
  file = file.join("\n");

  await fs.writeFile(filename, file);
  return;

}