# s3buffer

This library allows easy reading and writing buffers to a s3 bucket

## Installation
``` bash
npm install s3buffer
```

## Usage
``` javascript
const S3Buffer=require('s3buffer');
let s3buffer=new S3Buffer({
   accessKeyId:     'REDACTED',
   secretAccessKey: 'REDACTED',
   bucket:          'REDACTED'
});
await s3buffer.write("path",data);
let data=await s3buffer.read("path");
```
