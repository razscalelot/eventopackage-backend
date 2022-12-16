let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const eventModel = require('../../models/events.model');
const categorieModel = require('../../models/categories.model');
const async = require('async');
const mongoose = require('mongoose');
router.get('/', helper.authenticateToken, async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let imagesvideos = await primary.model(constants.MODELS.events, eventModel).find({ status : true }).populate({path : "event_category", model: primary.model(constants.MODELS.categories, categorieModel)}).select("-__v -othercost -services -equipments -discounts -createdAt -companydetail -tandc").lean();
        let allEventsImageVideo = [];
        async.forEachSeries(imagesvideos, (imagevideo, next_imagevideo) => {
            if (imagevideo.photos && imagevideo.photos != '' && imagevideo.videos && imagevideo.videos != '') {
                async.forEachSeries(imagevideo.photos, (photo, next_photo) => {
                    photo.eventid = imagevideo._id;
                    // photo.event_category = imagevideo.event_category;
                    // photo.display_name = imagevideo.display_name;
                    // photo.event_type = imagevideo.event_type;
                    photo.type = 'photo';
                    allEventsImageVideo.push(photo);
                    next_photo();
                });
                async.forEachSeries(imagevideo.videos, (video, next_video) => {
                    video.eventid = imagevideo._id;
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
module.exports = router;