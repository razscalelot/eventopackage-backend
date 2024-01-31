const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const entertainmentcommentModel = require('../../../models/entertainmentcomments.model');
const userModel = require('../../../models/users.model');
const async = require('async');
const mongoose = require('mongoose');
exports.postcomment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { entertainment_id, entertainment_url, comment } = req.body;
            if (entertainment_id && entertainment_id != '' && mongoose.Types.ObjectId.isValid(entertainment_id)) {
                if (entertainment_url && entertainment_url != '' && comment && comment != '') {
                    let obj = {
                        entertainment_id: mongoose.Types.ObjectId(entertainment_id),
                        entertainment_url: entertainment_url,
                        comment: comment,
                        user_id: mongoose.Types.ObjectId(req.token.organizerid),
                        timestamp: Date.now()
                    };
                    let lastinserted = await primary.model(constants.MODELS.entertainmentcomments, entertainmentcommentModel).create(obj);
                    let addedData = await primary.model(constants.MODELS.entertainmentcomments, entertainmentcommentModel).findById(lastinserted._id).populate({ path: 'user_id', model: primary.model(constants.MODELS.organizers, organizerModel), select: 'name profile_pic' });
                    return responseManager.onSuccess('Entertainment comment added successfully....', addedData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid data to comment on entertainment data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid entertainment id to comment on entertainment data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to comment on entertainment data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to comment on entertainment data, please try again' }, res);
    }
};
exports.allcomment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { entertainment_id, entertainment_url } = req.body;
            let allcomments = await primary.model(constants.MODELS.entertainmentcomments, entertainmentcommentModel).find({ entertainment_id: mongoose.Types.ObjectId(entertainment_id), entertainment_url: entertainment_url }).sort({ _id: 1 }).lean();
            if (allcomments && allcomments.length > 0) {
                let finalData = [];
                async.forEachSeries(allcomments, (comment, next_comment) => {
                    (async () => {
                        let userData = await primary.model(constants.MODELS.users, userModel).findById(comment.user_id).select('name profile_pic').lean();
                        if (userData == null) {
                            let userData = await primary.model(constants.MODELS.organizers, organizerModel).findById(comment.user_id).select('name profile_pic').lean();
                            comment.user_id = userData;
                        } else {
                            comment.user_id = userData;
                        }
                        finalData.push(comment);
                        next_comment();
                    })().catch((error) => { });
                }, () => {
                    return responseManager.onSuccess('Entertainment comments list....', finalData, res);
                });
            } else {
                return responseManager.onSuccess('Entertainment comments list....', [], res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to comment on entertainment data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to comment on entertainment data, please try again' }, res);
    }
};