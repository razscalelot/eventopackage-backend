const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const categorieModel = require('../../../models/categories.model');
const organizerModel = require('../../../models/organizers.model');
const eventModel = require('../../../models/events.model');
const async = require('async');
const mongoose = require('mongoose');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            const { page, limit, type } = req.body;
            if (page && page != '' && parseInt(page) != 0 && !isNaN(parseInt(page)) && limit && limit != '' && parseInt(limit) != 0 && !isNaN(parseInt(limit))) {
                let imagesvideos = await primary.model(constants.MODELS.events, eventModel).find({ createdBy: { $ne: mongoose.Types.ObjectId(req.token.organizerid) }, is_live: true }).populate([
                    { path: "event_category", model: primary.model(constants.MODELS.categories, categorieModel), select: "category_name" },
                    { path: "createdBy", model: primary.model(constants.MODELS.organizers, organizerModel), select: "name profile_pic about" },
                ]).select("-__v -othercost -services -equipments -updatedBy -discounts -capcity -companydetail -tandc").lean();
                let allEventsImageVideo = [];
                async.forEachSeries(imagesvideos, (imagevideo, next_imagevideo) => {
                    if (imagevideo.photos && imagevideo.photos != '' || imagevideo.videos && imagevideo.videos != '') {
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
                    let finalfinalArray = (type) ? allEventsImageVideo.filter((e) => e.type === type).slice((page - 1) * limit, page * limit) : allEventsImageVideo.slice((page - 1) * limit, page * limit);
                    // let finalfinalArray = allEventsImageVideo.slice((page - 1) * limit, page * limit);
                    return responseManager.onSuccess("Gallery List", finalfinalArray, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid Page and limit to get entertainment data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get gallery data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get gallery data please try again' }, res);
    }
};
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let imagesvideos = await primary.model(constants.MODELS.events, eventModel).find({ createdBy: { $ne: mongoose.Types.ObjectId(req.token.organizerid) }, is_live: true }).populate([
                { path: "event_category", model: primary.model(constants.MODELS.categories, categorieModel), select: "category_name" },
                { path: "createdBy", model: primary.model(constants.MODELS.organizers, organizerModel), select: "name profile_pic about" },
            ]).select("-__v -othercost -services -equipments -updatedBy -discounts -capcity -companydetail -tandc").lean();
            let allEventsImageVideo = [];
            async.forEachSeries(imagesvideos, (imagevideo, next_imagevideo) => {
                if (imagevideo.photos && imagevideo.photos != '' || imagevideo.videos && imagevideo.videos != '') {
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
            return responseManager.badrequest({ message: 'Invalid organizerid to get gallery data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get gallery data please try again' }, res);
    }
};