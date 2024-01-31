const responseManager = require('../../../utilities/response.manager');
const AwsCloud = require('../../../utilities/aws');
const allowedContentTypes = require("../../../utilities/content-types");
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.uploadvideo = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (req.file) {
                if (allowedContentTypes.videoarray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= parseInt(process.env.ALLOWED_VIDEO_UPLOAD_SIZE)) {
                        if (filesizeinMb > 25) {
                            AwsCloud.saveToS3Multipart(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        } else {
                            AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                                let obj = {
                                    s3_url: process.env.AWS_BUCKET_URI,
                                    url: result.data.Key
                                };
                                return responseManager.onSuccess('File uploaded successfully!', obj, res);
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Video file must be <= ' + process.env.ALLOWED_VIDEO_UPLOAD_SIZE + ' MB, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid file type only video files allowed, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to upload image, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to upload video, please try again' }, res);
    }
};