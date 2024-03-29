const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const AwsCloud = require('../../../utilities/aws');
const allowedContentTypes = require("../../../utilities/content-types");
const mongoose = require('mongoose');
exports.profilepic = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (req.file) {
            if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                if (filesizeinMb <= 5) {
                    AwsCloud.saveToS3(req.file.buffer, req.token.userid.toString(), req.file.mimetype, 'userprofile').then((result) => {
                        let obj = { profile_pic: result.data.Key };
                        primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, obj).then((updateResult) => {
                            (async () => {
                                let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
                                userData.s3Url = process.env.AWS_BUCKET_URI;
                                return responseManager.onSuccess('User profile pic updated successfully!', userData, res);
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
                    return responseManager.badrequest({ message: 'Image file must be <= 5 MB for profile pic, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid file type only image files allowed for profile pic, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid file to update user profile pic, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update user profile, please try again' }, res);
    }
};