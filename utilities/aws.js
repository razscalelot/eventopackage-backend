var fs = require('fs');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
const allowedContentTypes = require("./content-types");
const bucket = process.env.AWS_BUCKET_NAME;
let async = require('async');
const { error } = require('console');
var multipartMap = {
    Parts: []
};
var partNum = 0;
var partSize = 1024 * 1024 * 5;
var numPartsLeft = 0;
const acl = 'public-read';
const getBlobName = (originalName) => {
    const identifier = Math.random().toString().replace(/0\./, '');
    return `${identifier}-${originalName}`;
};
const setBlobName = (fName, extn) => {
    const identifier = Math.random().toString().replace(/0\./, '');
    return `${fName}/${fName}-${identifier}.${extn}`;
};
async function saveToS3Multipart(buffer, parentfolder, contentType, sendorreceive) {
    let promise = new Promise(function(resolve, reject) {
        let newContentType = contentType.split(";");
        let blobName = "";
        numPartsLeft = Math.ceil(buffer.length / partSize);
        allowedContentTypes.allowedContentTypes.some((element, index) => {
            if (element.mimeType == newContentType[0]) {
                blobName = parentfolder + '/' + sendorreceive + '/' + setBlobName(element.fName, element.extn);
            }
        });
        if (blobName != "") {
            var multiPartParams = {
                Bucket: bucket,
                Key: blobName,
                ContentType: contentType
            };
            s3.createMultipartUpload(multiPartParams, function (mpErr, multipart) {
                if (mpErr) { console.log('Error!', mpErr); return; }
                var j = [];
                for (var rangeStart = 0; rangeStart < buffer.length; rangeStart += partSize) {
                    let obj = {
                        rangeStart: rangeStart
                    };
                    j.push(obj);
                }
                async.forEachSeries(j, (ele, next_ele) => {
                    ( async () => {
                        partNum++;
                        var end = Math.min(ele.rangeStart + partSize, buffer.length),
                        partParams = {
                            Body: buffer.slice(ele.rangeStart, end),
                            Bucket: bucket,
                            Key: blobName,
                            PartNumber: String(partNum),
                            UploadId: multipart.UploadId,
                            ACL : acl
                        };
                        s3.uploadPart(partParams, function (multiErr, mData) {
                            if (multiErr) {
                                reject(new Error({msg: 'An error occurred while completing the multipart upload'}));
                            }
                            multipartMap.Parts[this.request.params.PartNumber - 1] = {
                                ETag: mData.ETag,
                                PartNumber: Number(this.request.params.PartNumber)
                            };
                            --numPartsLeft;
                            next_ele();
                        }); 
                    })().catch((error) => {});
                }, async () => {
                    if (numPartsLeft == 0){    
                        var doneParams = {
                            Bucket: bucket,
                            Key: blobName,
                            MultipartUpload: multipartMap,
                            UploadId: multipart.UploadId,
                            ACL : acl
                        };
                        s3.completeMultipartUpload(doneParams, function (err, data) {
                            if (err) {
                                reject(new Error({msg: 'An error occurred while completing the multipart upload'}));
                            } else {
                                resolve({msg: 'file uploaded successfully', data: data});
                            }
                        });
                    }
                });
            });
        }
    });
    return promise;
};
async function saveToS3(buffer, parentfolder, contentType, sendorreceive){
    let promise = new Promise(function(resolve, reject) {
        let newContentType = contentType.split(";");
        let blobName = "";
        allowedContentTypes.allowedContentTypes.some((element, index) => {
            if (element.mimeType == newContentType[0]) {
                blobName = parentfolder + '/' + sendorreceive + '/' + setBlobName(element.fName, element.extn);
            }
        });
        if (blobName != "") {
            var putParams = {
                Bucket: bucket,
                Key: blobName,
                Body: buffer,
                ContentType: contentType,
                ACL: acl
            };
            s3.upload(putParams, (err, data) => {
                if (err) {
                    reject(new Error({msg: 'An error occurred while completing the upload'}));
                }else{
                    resolve({msg: 'file uploaded successfully', data: data});
                }
            });
        }
    });
    return promise;
};
async function saveToS3withFileName(buffer, parentfolder, contentType, filename){
    let promise = new Promise(function(resolve, reject) {
        let newContentType = contentType.split(";");
        let blobName = "";
        allowedContentTypes.allowedContentTypes.some((element, index) => {
            if (element.mimeType == newContentType[0]) {
                blobName = parentfolder + '/' + filename;
            }
        });
        if (blobName != "") {
            var putParams = {
                Bucket: bucket,
                Key: blobName,
                Body: buffer,
                ContentType: contentType,
                ACL : acl
            };
            s3.upload(putParams, (err, data) => {
                if (err) {
                    reject(new Error({msg: 'An error occurred while completing the upload'}));
                }else{
                    resolve({msg: 'file uploaded successfully', data: data});
                }
            });
        }
    });
    return promise;
};
async function deleteFromS3(fileKey){
    let promise = new Promise(function(resolve, reject) {
        var params = {
            Bucket: bucket,
            Key: fileKey
        };
        s3.deleteObject(params, function(err, data) {
            if (err) reject(new Error({msg: 'An error occurred while deleting the file'}));
            else resolve({msg: 'file deleted successfully', data: data});
        });
    });
    return promise;
};
module.exports = { saveToS3Multipart, saveToS3, saveToS3withFileName, deleteFromS3 };