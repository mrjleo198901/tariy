const version = process.version.match(/^v(\d+\.\d+)/)[1];

if (parseFloat(version) < 15){

  console.error('----------------------------------------------------------------------\n')
  console.error('⚠️   Please use Node 15+ to continue.');
  console.error('    Your version: ' + version + '\n');
  console.error('----------------------------------------------------------------------\n');
  process.exit(1);
  
}