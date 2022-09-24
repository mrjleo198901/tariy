const aws = require('aws-sdk');
const fs = require('fs');
const s3 = new aws.S3({ signatureVersion: 'v4', region: process.env.S3_REGION });

/*
* s3.bucket()
* return a list of buckets on your s3 account
*/

exports.bucket = async function(){

  return await s3.listBuckets().promise();

}

/*
* s3.bucket.items()
* return a list of items in the bucket
*/

exports.bucket.items = async function(bucket){

  return await s3.listObjects({ Bucket: bucket }).promise();

}

/*
* s3.bucket.create()
* create a new s3 bucket
*/

exports.bucket.create = async function(name){

  return await s3.createBucket({ Bucket: name }).promise();

}

/*
* s3.bucket.delete()
* delete an s3 bucket
*/

exports.bucket.delete = async function(name){

  // empty the bucket first
  const items = await s3.listObjects({ Bucket: name }).promise();

  if (items?.Contents?.length){
    await s3.deleteObjects({ 
      
      Bucket: name, 
      Delete: { Objects: items.Contents.map(x => { return { Key: x.Key }}) }
    
    }).promise();
  }

  // delete the bucket
  return await s3.deleteBucket({ Bucket: name }).promise();

}

/*
* s3.upload()
* upload a file to a bucket
* pass the bucket name and file object
*/

exports.upload = async function(bucket, file){

  // upload it to s3
  const content = fs.readFileSync(file.path);

  return await s3.putObject({

    Bucket: bucket,
    Key: file.originalname,
    Body: content,
    ContentType: file.mimetype

  }).promise();
}

/*
* s3.delete()
* delete a file from a bucket
*/

exports.delete = async function(bucket, filename){

  return await s3.deleteObjects({

    Bucket: bucket,
    Delete: { Objects: [{ Key: filename }] }
    
  }).promise();
}

/*
* s3.signedURL()
* get a signed url for a bucket in a filename
*/

exports.signedURL = function(filename, bucket, expires, acl){

  return new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', {

      Expires: expires || 3600,
      Bucket: bucket || process.env.S3_BUCKET,
      Key: filename,
      ...acl && { ACL: acl },

    }, (err, url) => {

      err ? reject(err) : resolve(url);

    });
  });
}