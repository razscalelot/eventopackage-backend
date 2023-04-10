const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.removeevent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let maineventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (maineventData && maineventData.iseditable == true) {
                    await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {status : false, is_approved : false, is_live : false});
                    return responseManager.onSuccess('Organizer event removed successfully!', 1, res);
                } else {
                    return responseManager.badrequest({ message: 'Event data can not be updated as event booking started..., Please contact admin to update event data' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid eventid to remove event, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to remove event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or remove event, please try again' }, res);
    }
};