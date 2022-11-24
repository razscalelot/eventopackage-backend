const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.tandc = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid, status } = req.body;
            if (status && status == true) {
                if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                    let obj = {
                        t_and_c: (req.body.t_and_c) ? req.body.t_and_c : '',
                        facebook: (req.body.facebook) ? req.body.facebook : '',
                        twitter: (req.body.twitter) ? req.body.twitter : '',
                        youtube: (req.body.youtube) ? req.body.youtube : '',
                        pinterest: (req.body.pinterest) ? req.body.pinterest : '',
                        instagram: (req.body.instagram) ? req.body.instagram : '',
                        linkedin: (req.body.linkedin) ? req.body.linkedin : '',
                        status: (req.body.status) ? req.body.status : false,
                    };
                    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                    await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), tandc: obj });
                    let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                    return responseManager.onSuccess('Organizer event personal data updated successfully!', eventData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id to add event terms and conditions data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Please accept terms and condition to update tandc data for event, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event terms and conditions data, please try again' }, res);
    }
};
exports.gettandc = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, tandc: eventData.tandc }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};