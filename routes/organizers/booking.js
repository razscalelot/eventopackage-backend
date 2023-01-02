let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const eventModel = require('../../models/events.model');
const organizerModel = require('../../models/organizers.model');
const eventbookingModel = require('../../models/eventbookings.model');
const userModel = require('../../models/users.model');
const async = require("async");
const mongoose = require('mongoose');
router.post('/list', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerdata = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (organizerdata && organizerdata.status == true && organizerdata.mobileverified == true) {
            const { page, limit, search } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let eventData = await primary.model(constants.MODELS.events, eventModel).find({ createdBy: mongoose.Types.ObjectId(req.token.organizerid) }).select("_id").lean();
            let allEventsId = [];
            let query = {};
            async.forEachSeries(eventData, (event, next_booking) => {
                if (event._id && event._id != '' && mongoose.Types.ObjectId.isValid(event._id)) {
                    allEventsId.push(mongoose.Types.ObjectId(event._id));
                }
                next_booking();
            });
            query = {
                eventId: { $in: allEventsId } 
            };
            primary.model(constants.MODELS.eventbookings, eventbookingModel).paginate(query, {
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                populate: {
                    path: 'userid',
                    model: primary.model(constants.MODELS.users, userModel),
                    select : 'name profile_name'
                },                
                // select: '_id userid eventId trans_Id name url category_name address payment_status createdAt updatedAt selectedItems selectedEquipments selectedServices totalPrice start_date end_date start_time end_time start_timestamp end_timestamp',
                lean: true
            }).then((eventBookingData) => {
                return responseManager.onSuccess('Booking list data!', eventBookingData, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event discount details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
});
module.exports = router;