const mail = require('../model/mail');
const s3 = require('../model/s3');

exports.upload = async function(req, res){

  // files stored in req.files
  // automatically saved to /uploads folder
  // all other fields stored in req.body
  // upload the file to an s3 bucket
  if (req.files.length){
    for (file of req.files){

      await s3.upload('YOUR_BUCKET', file);

    }
  }

  res.status(200).send({ message: 'Upload complete' });

}

/* 
*  public mail endpoint 
*  can only email you to prevent spam
*/

exports.mail = async function(req, res){

  await mail.send({

    to: process.env.SUPPORT_EMAIL,
    template: req.body.template || 'contact',
    content: {
  
      name: req.body.name,
      email: req.body.email,
      message: req.body.message
  
    }
  });

  res.status(200).send({ message: 'Message sent' });

}