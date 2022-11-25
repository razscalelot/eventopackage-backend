const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.companydetail = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let obj = {
                    name: (req.body.name) ? req.body.name : '',
                    gst: (req.body.gst) ? req.body.gst : '',
                    contact_no: (req.body.contact_no) ? req.body.contact_no : '',
                    email: (req.body.email) ? req.body.email : '',
                    about: (req.body.about) ? req.body.about : '',
                    flat_no: (req.body.flat_no) ? req.body.flat_no : '',
                    street: (req.body.street) ? req.body.street : '',
                    area: (req.body.area) ? req.body.area : '',
                    city: (req.body.city) ? req.body.city : '',
                    state: (req.body.state) ? req.body.state : '',
                    pincode: (req.body.pincode) ? req.body.pincode : '',
                    photos : req.body.photos,
                    videos : req.body.videos
                };
                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), companydetail: obj });
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                return responseManager.onSuccess('Organizer event company data updated successfully!', eventData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to add event company data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event company data, please try again' }, res);
    }
};
exports.getcompanydetail = async (req, res) => {
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
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, companydetail: eventData.companydetail }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event company details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};