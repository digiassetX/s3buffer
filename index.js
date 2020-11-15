const AWS=require('aws-sdk');

/**
 * Converts a stream to a Buffer
 * @param stream
 * @return {Promise<Buffer>}
 */
const streamToBuffer=async (stream)=>{
    return new Promise(resolve => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
}



class S3Buffer {
    constructor(options) {
        this._s3= new AWS.S3({
            accessKeyId:        options.accessKeyId,
            secretAccessKey:    options.secretAccessKey
        });
        this._bucket=options.bucket;
    }

    /**
     * @param {string}  path
     * @return {Promise<Buffer>}
     */
    async read(path) {
        return new Promise(async (resolve, reject) => {
            let stream = (await this._s3.getObject({
                Bucket: this._bucket,
                Key: path
            })).createReadStream();
            stream.on('error', (error) => {
                return reject(error);
            });
            resolve(await streamToBuffer(stream));
        })
    };

    /**
     * @param {string}  path
     * @param {Buffer}  data
     * @return {Promise<void>}
     */
    async write(path,data) {
        return new Promise((resolve, reject) => {
            this._s3.upload({
                Bucket: this._bucket,
                Key:    path,
                Body:   data
            }, function (s3Err) {
                if (s3Err) {
                    reject(s3Err);
                } else {
                    resolve();
                }
            });
        });
    };


    /**
     * Deletes a file
     * @param path
     * @return {Promise<void>}
     */
    async delete(path) {
        await this._s3.deleteObjects({
            Bucket: this._bucket,
            Delete: {
                Objects: [
                    {
                        Key: path
                    }
                ]
            }
        }).promise();
    }

    /**
     * Deletes all files in a directory.  If no path clears the entire bucket
     * @param {String}  path
     * @return {Promise<void>}
     */
    async clear(path=undefined) {
        return new Promise(async (resolve, reject) => {

            let listParams = {Bucket: this._bucket}
            if (path !== undefined) listParams.Prefix = path;
            while (true) {
                // list objects
                const listedObjects = await this._s3.listObjectsV2(listParams).promise();
                if (listedObjects.Contents === undefined) {
                    return reject(new Error('Listing S3 returns no contents'));
                }
                if (listedObjects.Contents.length !== 0) {
                    await this._s3.deleteObjects({
                        Bucket: this._bucket,
                        Delete: {
                            Objects: listedObjects.Contents.map(obj => ({
                                Key: obj.Key
                            }))
                        }
                    }).promise();
                }
                if (!listedObjects.IsTruncated) return resolve();
            }
        });
    }

    /**
     * Checks if file exists
     * @param {string} path
     * @return {Promise<boolean>}
     */
    async exists(path) {
        return new Promise(async (resolve, reject) => {
            this._s3.headObject({
                Bucket: this._bucket,
                Key: path
            }, function (err, metadata) {
                return resolve(!err);
            });
        });
    }
}
module.exports=S3Buffer;