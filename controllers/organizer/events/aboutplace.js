const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.aboutplace = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid, banner, place_price, price_type, max_day, clearing_time, facilities, person_capacity, parking_capacity, details } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let maineventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (maineventData && maineventData.iseditable == true) {
                    if (place_price && place_price != '' && price_type && price_type != '' && clearing_time && clearing_time != '') {
                        if (price_type == 'per_event') {
                            if (max_day && max_day != '') {
                                let obj = {
                                    banner: banner,
                                    place_price: place_price,
                                    price_type: price_type,
                                    max_day: max_day,
                                    clearing_time: clearing_time,
                                    facilities: facilities,
                                    person_capacity: person_capacity,
                                    parking_capacity: parking_capacity,
                                    details: details
                                };
                                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), aboutplace: obj });
                                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                                return responseManager.onSuccess('Organizer event about data updated successfully!', eventData, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid about place details max day can not be empty, please try again' }, res);
                            }
                        } else {
                            let obj = {
                                banner: banner,
                                place_price: place_price,
                                price_type: price_type,
                                max_day: null,
                                clearing_time: clearing_time,
                                person_capacity: person_capacity,
                                parking_capacity: parking_capacity,
                                details: details
                            };
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), aboutplace: obj });
                            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                            return responseManager.onSuccess('Organizer event about data updated successfully!', eventData, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event id to add event about place data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Event data can not be updated as event booking started..., Please contact admin to update event data' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to add event about place data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event about place data, please try again' }, res);
    }
};
exports.getaboutplace = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, aboutplace: eventData.aboutplace }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get about event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};