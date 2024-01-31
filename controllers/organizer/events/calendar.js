const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const organizerModel = require('../../../models/organizers.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const async = require("async");
const mongoose = require('mongoose');
const getDays = (year, month) => {
    return new Date(year, month, 0).getDate();
};
exports.calendar = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventId, month, year } = req.body;
            if (eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                let today = new Date(month + '/01/' + year);
                let i = 1;
                let finalObj = [];
                const daysInMonth = getDays(parseInt(year), parseInt(month));
                for (i = 1; i <= daysInMonth; i++) {
                    finalObj.push({
                        index : i,
                        day : today.getFullYear() + '-' + ((today.getMonth() + 1) < 10 ? '0' : '') + (today.getMonth() + 1)  + '-' + (today.getDate() < 10 ? '0' : '') + today.getDate()
                    })
                    today.setDate(today.getDate() + 1);
                }
                let finalBookings = {}; 
                async.forEachSeries(finalObj, (day, next_day) => {
                    (async () => {
                        let start = new Date(day.day + ' 00:00:00').getTime() + 19800000;
                        let end = new Date(day.day + ' 23:59:00').getTime() + 19800000;
                        let bookings = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({
                            eventId: mongoose.Types.ObjectId(eventId),
                            $or: [
                                {
                                    $and : [
                                        { start_timestamp : { $gte: start }},{ start_timestamp : { $lte: end }}, 
                                        { end_timestamp : { $gte: start }},  { end_timestamp : { $lte: end }}
                                    ]
                                },
                                {
                                    start_timestamp: { $lte: start }, end_timestamp: { $gte: end }
                                }, 
                                {
                                    $and : [{start_timestamp: { $gte: start }}, {start_timestamp: { $lte: end }}]
                                },
                                {
                                    $and : [{end_timestamp: { $gte: start }}, {end_timestamp: { $lte: end }}]
                                }
                            ]
                        }).select("name start_time end_time start_date end_date").sort({ start_timestamp: 1 }).lean();
                        if(bookings && bookings.length > 0){
                            finalBookings[day.day] = bookings;
                        }else{
                            finalBookings[day.day] = [];
                        }
                        next_day();
                    })().catch((error) => {});
                }, () => {
                    return responseManager.onSuccess('all bookings', finalBookings, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid organizer data to check event booking availability, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
    }
};