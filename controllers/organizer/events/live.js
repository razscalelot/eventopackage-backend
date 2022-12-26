const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
const async = require('async');
exports.makeonelive = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.body;
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if(eventData && eventData != null && (eventData.createdBy.toString() == req.token.organizerid.toString())){
                    if(eventData.is_approved == true){
                        if(eventData.is_live == true){
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_live : false});
                            return responseManager.onSuccess('Organizer event removed from live successfully!', 1, res);
                        }else{
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_live : true});
                            return responseManager.onSuccess('Organizer event live successfully!', 1, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Event is not approved yet, so it can not be live, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id to live event data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to live event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to live event data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to live event data, please try again' }, res);
    }
};
exports.makemultilive = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventids } = req.body;
            if(eventids && eventids.length > 0){
                async.forEachSeries(eventids, (eventid, next_eventid) => {
                    ( async () => {
                        if( eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                            if(eventData && eventData != null && (eventData.createdBy.toString() == req.token.organizerid.toString())){
                                if(eventData.is_approved == true){
                                    if(eventData.is_live == true){
                                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_live : false});
                                        next_eventid();
                                    }else{
                                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_live : true});
                                        next_eventid();
                                    }
                                }else{
                                    next_eventid();
                                }
                            }else{
                                next_eventid();
                            }
                        }else{
                            next_eventid();
                        }
                    })().catch((error) => {});
                }, () => {
                    return responseManager.onSuccess('Organizer events live successfully!', 1, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Invalid event ids to live event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to live event data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to live event data, please try again' }, res);
    }
};