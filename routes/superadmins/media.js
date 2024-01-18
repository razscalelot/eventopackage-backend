var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const superadminModel = require('../../models/superadmins.model');
const mongoose = require('mongoose');
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadminData = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).select('-password').lean();
        if(superadminData && superadminData.status == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.superadminid.toString(), req.file.mimetype, 'global').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Image file must be <= '+process.env.ALLOWED_IMAGE_UPLOAD_SIZE+' MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid superadminid to upload image, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
router.post('/video', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadminData = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).select('-password').lean();
        if(superadminData && organizerData.status == true){
            if (req.file) {
                if (allowedContentTypes.videoarray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= parseInt(process.env.ALLOWED_VIDEO_UPLOAD_SIZE)) {
                        if(filesizeinMb > 25){
                            AwsCloud.saveToS3Multipart(req.file.buffer, req.token.superadminid.toString(), req.file.mimetype, 'global').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }else{
                            AwsCloud.saveToS3(req.file.buffer, req.token.superadminid.toString(), req.file.mimetype, 'global').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Video file must be <= '+process.env.ALLOWED_VIDEO_UPLOAD_SIZE+' MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only video files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid superadminid to upload video, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload video, please try again' }, res);
    }
});
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadminData = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).select('-password').lean();
        if(superadminData && superadminData.status == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= parseInt(process.env.ALLOWED_BANNER_UPLOAD_SIZE)) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.superadminid.toString(), req.file.mimetype, 'global').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Banner file must be <= '+process.env.ALLOWED_BANNER_UPLOAD_SIZE+' MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid superadminid to upload banner, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
router.post('/document', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
     res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadminData = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).select('-password').lean();
        if(superadminData && superadminData.status == true && superadminData.mobileverified == true){
            if (req.file) {
                if (allowedContentTypes.docarray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= parseInt(process.env.ALLOWED_DOCUMENT_UPLOAD_SIZE)) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.superadminid.toString(), req.file.mimetype, 'global').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Document file must be <= '+process.env.ALLOWED_DOCUMENT_UPLOAD_SIZE+' MB, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only document (PDF) files allowed, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid superadminid to upload document, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload document, please try again' }, res);
    }
});
module.exports = router;