const eventModel = require('../../../models/events.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const async = require('async');
const mongoose = require('mongoose');
exports.calendar = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventId, start_date, end_date, start_time, end_time } = req.body;
            if (eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                if (start_date && end_date && start_time && end_time) {
                    let xstart_date = start_date.split("-");
                    let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + start_time).getTime();
                    let yend_date = end_date.split("-");
                    let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + end_time).getTime();
                    let existingData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ eventId: mongoose.Types.ObjectId(eventId) }).lean();
                    if (existingData && existingData.length > 0) {
                        let flg = 1;
                        async.forEachSeries(existingData, (booking, next_booking) => {
                            if (booking.start_timestamp && booking.end_timestamp && ((booking.start_timestamp >= startTimestamp && startTimestamp <= booking.end_timestamp) || (booking.start_timestamp >= endTimestamp && endTimestamp <= booking.end_timestamp))) {
                                flg = 0;
                            }
                            next_booking();
                        }, () => {
                            if (flg) {
                                return responseManager.onSuccess('Bookings available on the selected date and time.', 1, res);
                            } else {
                                return responseManager.onSuccess('There are no bookings available on the selected date and time.', 0, res);
                            }
                        });
                    } else {
                        return responseManager.onSuccess('Bookings available on the selected date and time.', 1, res)
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id to check event booking availability, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid user data to check event booking availability, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update ev ent calendar data, please try again' }, res);
    }
};