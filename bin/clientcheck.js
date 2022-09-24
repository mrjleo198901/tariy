const fs = require('fs');
const folders = ['client', 'client-react-web'];
const renameTo = 'client';

// checks if client exists before running client 
// installation during package.json setup
async function run(){
  try {

    let success = false;

    for (let folder of folders){
      if (!success){
      
        if (fs.existsSync(`../${folder}`)){
        
          success = true;

          if (folder !== renameTo)
            fs.rename(`../${folder}`, `../${renameTo}`, () => {});

        }
      }
    }

    return process.exit(success ? 0 : 128);

  }
  catch (err) {

    console.error(err);
    return process.exit(128);
    
  }
}

run();