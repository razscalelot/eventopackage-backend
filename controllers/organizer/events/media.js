const eventModel = require('../../../models/events.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.media = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, banner, photos, videos } = req.body;
        if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), banner : banner, photos : photos, videos: videos});
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
            return responseManager.onSuccess('Organizer event media data updated successfully!', eventData, res);
        }else{
            return responseManager.badrequest({message : 'Invalid event id to add event media data, please try again'}, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update event arrangement data, please try again' }, res);
    }
};
exports.getmedia = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
            return responseManager.onSuccess('Organizer event data!', {_id : eventData._id, banner : eventData.banner, photos : eventData.photos, videos : eventData.videos}, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};