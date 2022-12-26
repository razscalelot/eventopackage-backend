let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const eventModel = require('../../models/events.model');
const { default: mongoose } = require("mongoose");
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid, event_category, page, limit, search, sortfield, sortoption, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            let query = {};
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                query.createdBy = mongoose.Types.ObjectId(organizerid);
            }
            if(event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)){
                query.event_category = mongoose.Types.ObjectId(event_category);
            }
            if(status && status != null && status != undefined){
                query.status = status;
            }
            primary.model(constants.MODELS.events, eventModel).paginate({
                $or: [
                    { name : { '$regex' : new RegExp(search, "i") } },
                    { event_type : { '$regex' : new RegExp(search, "i") } }
                ],
                ...query
            },{
                page,
                limit: parseInt(limit),
                sort: { [sortfield] : [sortoption] },
                lean: true
            }).then((eventsList) => {
                return responseManager.onSuccess('events list!', eventsList, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get events list, please try again' }, res);
    }
});
router.post('/approve', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if(eventData){
                    if(eventData.status == false){
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_approved : true});
                        return responseManager.onSuccess('Event approved sucecssfully!', 1, res);
                    }else{
                        return responseManager.badrequest({ message: 'Event is already approved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Event data not found to approve event, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to approve event, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/disapprove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if(eventData){
                    if(eventData.status == true){
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_approved : false});
                        return responseManager.onSuccess('Event disapproved sucecssfully!', 1, res);
                    }else{
                        return responseManager.badrequest({ message: 'Event is already disapproved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Event data not found to disapprove, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to disapprove event, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                await primary.model(constants.MODELS.events, eventModel).findByIdAndRemove(eventid);
                return responseManager.onSuccess('Event removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to remove event data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
                return responseManager.onSuccess('Event data !', eventData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
});
module.exports = router;