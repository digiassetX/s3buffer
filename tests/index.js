require('nodeunit');
const S3Buffer = require('../index');
const sleep=require('sleep-promise');

//generate some random files
/**
 * @param {int} length
 * @return {Buffer}
 */
const makeRandom=(length)=>{
    let data=Buffer.alloc(length);
    for (let i=0;i<length;i++) data[i]=Math.floor(Math.random()*256);
    return data;
}
const file0500=makeRandom(500);
//make copy of a buffer so we know it checks buffers are same value and not necessarily same buffer
const copy0500=Buffer.from(file0500);



module.exports = {
    'Test S3': async function(test) {
        const longterm={
            accessKeyId:     'REDACTED',
            secretAccessKey: 'REDACTED',
            bucket:          'REDACTED'
        }
        if (longterm.accessKeyId==="REDACTED") return;  //can't do test if keys are redacted.
        let s3buffer=new S3Buffer(longterm);

        //add some files and make sure they are in long term
        await s3buffer.write('a',file0500);

        //destroy the RAM cache and see if still works from s3 bucket
        s3buffer=false;
        s3buffer=new S3Buffer(longterm);
        test.equal(Buffer.compare(await s3buffer.read("a"),copy0500),0);

        //check exists feature
        test.equal(await s3buffer.exists("a"),true);
        test.equal(await s3buffer.exists("b"),false);

        //try deleting a file
        await s3buffer.delete('a');
        test.equal(await s3buffer.exists("a"),false);

        //try clearing all files starting with a prefix
        await s3buffer.write('a',file0500);
        await s3buffer.write('te',file0500);
        await s3buffer.write('te1',file0500);
        await s3buffer.write('te2',file0500);
        await s3buffer.clear("te");
        test.equal(await s3buffer.exists("a"),true);
        test.equal(await s3buffer.exists("te"),false);
        test.equal(await s3buffer.exists("te1"),false);
        test.equal(await s3buffer.exists("te2"),false);

        //clear bucket
        await s3buffer.clear();
        test.equal(await s3buffer.exists("a"),false);


        test.done();
    }
};

