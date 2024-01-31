const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const AwsCloud = require('../../../utilities/aws');
const allowedContentTypes = require("../../../utilities/content-types");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.setprofilepic = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (req.file) {
            if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                    AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'organizerprofile').then((result) => {
                        let obj = { profile_pic: result.data.Key };
                        primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, obj).then((updateResult) => {
                            (async () => {
                                let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
                                organizerData.s3Url = process.env.AWS_BUCKET_URI;
                                return responseManager.onSuccess('Organizer profile pic updated successfully!', organizerData, res);
                            })().catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }).catch((error) => {
                        return responseManager.onError(error, res);
                    });
                } else {
                    return responseManager.badrequest({ message: 'Image file must be <= '+process.env.ALLOWED_IMAGE_UPLOAD_SIZE+' MB for profile pic, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid file type only image files allowed for profile pic, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid file to update organizer profile pic, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update organizer profile, please try again' }, res);
    }
};