const eventModel = require('../../../models/events.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.createevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, display_name, event_type, event_category } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            if (display_name && display_name.trim() != '' && event_type && event_type.trim() != '' && ((event_category && event_category.trim() != ''))) {
                let obj = {
                    display_name: display_name,
                    event_type: event_type,
                    event_category: event_category,
                    updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                };
                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, obj);
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
                return responseManager.onSuccess('Organizer event updated successfully!', eventData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid data to update event, please try again' }, res);
            }
        } else {
            if (display_name && display_name.trim() != '' && event_type && event_type.trim() != '' && ((event_category && event_category.trim() != ''))) {
                let obj = {
                    display_name: display_name,
                    event_type: event_type,
                    event_category: event_category,
                    createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                    updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                    timestamp: Date.now(),
                    status: false
                };
                let createdEvent = await primary.model(constants.MODELS.events, eventModel).create(obj);
                return responseManager.onSuccess('Organizer event created successfully!', createdEvent, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid data to create event, please try again' }, res);
            }
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or update event, please try again' }, res);
    }
};