const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const categoryModel = require('../../../models/categories.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.createevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, display_name, event_type, event_category } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let maineventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (maineventData && maineventData.iseditable == true) {
                    if (display_name && display_name.trim() != '' && event_type && event_type.trim() != '' && event_category && event_category.trim() != '') {
                        if (event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)) {
                            let obj = {
                                display_name: display_name,
                                event_type: event_type,
                                event_category: mongoose.Types.ObjectId(event_category),
                                updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                            };
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, obj);
                            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                                path: "event_category",
                                model: primary.model(constants.MODELS.categories, categoryModel),
                                select: '-createdAt -updatedAt -__v -createdBy -updatedBy'
                            }).lean();
                            if (eventData && eventData != null) {
                                return responseManager.onSuccess('Organizer event created successfully!', { _id: eventData._id, display_name: eventData.display_name, event_type: eventData.event_type, event_category: eventData.event_category }, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid event category or other value to update event, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid data to update event, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Event data can not be updated as event booking started..., Please contact admin to update event data' }, res);
                }
            } else {
                if (display_name && display_name.trim() != '' && event_type && event_type.trim() != '' && event_category && event_category.trim() != '') {
                    if (event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)) {
                        let obj = {
                            display_name: display_name,
                            event_type: event_type,
                            event_category: mongoose.Types.ObjectId(event_category),
                            createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                            updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                            timestamp: Date.now(),
                            is_approved: false,
                            is_live: false,
                            status: true,
                            iseditable: true,
                            isFormSubmitted: false
                        };
                        let createdEvent = await primary.model(constants.MODELS.events, eventModel).create(obj);
                        let eventData = await primary.model(constants.MODELS.events, eventModel).findById(createdEvent._id).populate({
                            path: "event_category",
                            model: primary.model(constants.MODELS.categories, categoryModel),
                            select: '-createdAt -updatedAt -__v -createdBy -updatedBy'
                        }).lean();
                        if (eventData && eventData != null) {
                            return responseManager.onSuccess('Organizer event created successfully!', { _id: eventData._id, display_name: eventData.display_name, event_type: eventData.event_type, event_category: eventData.event_category }, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event category or other value to update event, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid data to create event, please try again' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or update event, please try again' }, res);
    }
};
exports.getevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                    path: "event_category",
                    model: primary.model(constants.MODELS.categories, categoryModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy'
                }).lean();
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, display_name: eventData.display_name, event_type: eventData.event_type, event_category: eventData.event_category, isFormSubmitted: eventData.isFormSubmitted }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};