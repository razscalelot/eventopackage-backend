let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const eventModel = require('../../models/events.model');
const categorieModel = require('../../models/categories.model');
const organizerModel = require('../../models/organizers.model');
const userModel = require('../../models/users.model');
const entertainmentcommentModel = require('../../models/entertainmentcomments.model');
const async = require('async');
const mongoose = require('mongoose');
router.get('/', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let imagesvideos = await primary.model(constants.MODELS.events, eventModel).find({ status : true, is_live: true }).sort({_id: -1}).populate([
            {path : "event_category", model: primary.model(constants.MODELS.categories, categorieModel), select: "category_name"},
            {path : "createdBy", model: primary.model(constants.MODELS.organizers, organizerModel), select: "name profile_pic"}            
        ]).select("-__v -othercost -services -equipments -discounts -createdAt -companydetail -tandc").lean();
        let allEventsImageVideo = [];
        async.forEachSeries(imagesvideos, (imagevideo, next_imagevideo) => {
            if (imagevideo.photos && imagevideo.photos != '' && imagevideo.videos && imagevideo.videos != '') {
                async.forEachSeries(imagevideo.photos, (photo, next_photo) => {
                    photo._id = imagevideo._id;
                    photo.event_category = imagevideo.event_category;
                    photo.createdBy = imagevideo.createdBy;
                    photo.display_name = imagevideo.display_name;
                    photo.event_type = imagevideo.event_type;
                    photo.timestamp = imagevideo.timestamp;
                    photo.status = imagevideo.status;
                    photo.createdAt = imagevideo.createdAt;
                    photo.updatedAt = imagevideo.updatedAt;
                    photo.aboutplace = imagevideo.aboutplace;
                    photo.personaldetail = imagevideo.personaldetail;
                    photo.capacity = imagevideo.capacity;
                    photo.type = 'photo';
                    allEventsImageVideo.push(photo);
                    next_photo();
                });
                async.forEachSeries(imagevideo.videos, (video, next_video) => {
                    video._id = imagevideo._id;
                    video.event_category = imagevideo.event_category;
                    video.createdBy = imagevideo.createdBy;
                    video.display_name = imagevideo.display_name;
                    video.event_type = imagevideo.event_type;
                    video.timestamp = imagevideo.timestamp;
                    video.status = imagevideo.status;
                    video.createdAt = imagevideo.createdAt;
                    video.updatedAt = imagevideo.updatedAt;
                    video.aboutplace = imagevideo.aboutplace;
                    video.personaldetail = imagevideo.personaldetail;
                    video.capacity = imagevideo.capacity;
                    video.type = 'video';
                    allEventsImageVideo.push(video);
                    next_video();
                });
            }
            next_imagevideo();
        }, () => {
            return responseManager.onSuccess("Gallery List", allEventsImageVideo, res);
        }); 
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get gallery data please try again' }, res);
    }
});
router.post('/comment', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if (userData && userData.status == true && userData.mobileverified == true) {
            const { entertainment_id, entertainment_url, comment } = req.body;
            if (entertainment_id && entertainment_id != '' && mongoose.Types.ObjectId.isValid(entertainment_id)) {
                if (entertainment_url && entertainment_url != '' && comment && comment != '') {
                    let obj = {
                        entertainment_id: mongoose.Types.ObjectId(entertainment_id),
                        entertainment_url: entertainment_url,
                        comment: comment,
                        user_id: mongoose.Types.ObjectId(req.token.userid),
                        timestamp: Date.now()
                    };
                    let lastinserted = await primary.model(constants.MODELS.entertainmentcomments, entertainmentcommentModel).create(obj);
                    let addedData = await primary.model(constants.MODELS.entertainmentcomments, entertainmentcommentModel).findById(lastinserted._id).populate({ path: 'user_id', model: primary.model(constants.MODELS.users, userModel), select: 'name profile_pic' });
                    return responseManager.onSuccess('Entertainment comment added successfully....', addedData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid data to comment on entertainment data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid entertainment id to comment on entertainment data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to comment on entertainment data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to comment on entertainment data, please try again' }, res);
    }
});
router.post('/allcomments', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if(userData && userData.status == true && userData.mobileverified == true){
            const { entertainment_id, entertainment_url } = req.body;
            let allcomments =  await primary.model(constants.MODELS.entertainmentcomments, entertainmentcommentModel).find({entertainment_id : mongoose.Types.ObjectId(entertainment_id), entertainment_url : entertainment_url}).sort({_id : 1}).lean();
            if(allcomments && allcomments.length > 0){
                let finalData = [];
                async.forEachSeries(allcomments, (comment, next_comment) => {
                    ( async () => {
                        let userData = await primary.model(constants.MODELS.users, userModel).findById(comment.user_id).select('name profile_pic').lean();
                        if(userData == null){
                            let userData = await primary.model(constants.MODELS.organizers, organizerModel).findById(comment.user_id).select('name profile_pic').lean();
                            comment.user_id = userData;
                        }else{
                            comment.user_id = userData;
                        }
                        finalData.push(comment);
                        next_comment();
                    })().catch((error) => {});
                }, () => {
                    return responseManager.onSuccess('Entertainment comments list....', finalData, res);
                });
            }else{
                return responseManager.onSuccess('Entertainment comments list....', [], res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid userid to comment on entertainment data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to comment on entertainment data, please try again' }, res);
    }
});
module.exports = router;