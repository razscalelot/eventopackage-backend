let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const eventModel = require('../../models/events.model');
const organizerModel = require('../../models/organizers.model');
const eventbookingModel = require('../../models/eventbookings.model');
const eventreviewModel = require('../../models/eventreviews.model');
const async = require("async");
const mongoose = require('mongoose');
router.get('/list', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerdata = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (organizerdata && organizerdata.status == true && organizerdata.mobileverified == true) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let eventData = await primary.model(constants.MODELS.events, eventModel).find({ createdBy: mongoose.Types.ObjectId(req.token.organizerid) }).select("_id").lean();
            let allEventsId = [];
            async.forEachSeries(eventData, (event, next_wishlist) => {
                if (event._id && event._id != '' && mongoose.Types.ObjectId.isValid(event._id)) {
                    allEventsId.push(mongoose.Types.ObjectId(event._id));
                }
                next_wishlist();
            });
            let eventBookingData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ eventId: { $in: allEventsId } }).lean();

            if (eventBookingData && eventBookingData != null) {
                return responseManager.onSuccess('Booking list data!', eventBookingData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event discount details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
});
module.exports = router;