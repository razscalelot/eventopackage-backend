const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const userModel = require('../../../models/users.model');
const async = require("async");
const mongoose = require('mongoose');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { page, limit, date, time, event_type, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            let bookingquery = {};
            let eventquery = {};
            if (date) {
                if (time && time != '') {
                    let starttimestamp = new Date(date + ' ' + time).getTime() + 19800000;
                    bookingquery.created_at = { "$gte": starttimestamp };
                } else {
                    let starttimestamp = new Date(date + ' 00:00').getTime() + 19800000;
                    console.log("starttimestamp", starttimestamp);
                    bookingquery.created_at = { "$gte": starttimestamp };
                }
            }
            console.log("bookingquery", bookingquery);
            if (event_type && event_type != '') {
                eventquery.event_type = event_type;
            }
            let allEvents = await primary.model(constants.MODELS.events, eventModel).find({ createdBy: mongoose.Types.ObjectId(req.token.organizerid), ...eventquery }).select('display_name').lean();
            let eventIds = [];
            async.forEachSeries(allEvents, (event, next_event) => {
                eventIds.push(mongoose.Types.ObjectId(event._id));
                next_event();
            }, () => {
                (async () => {
                    await primary.model(constants.MODELS.eventbookings, eventbookingModel).paginate({
                        $or: [
                            { name: { '$regex': new RegExp(search, "i") } },
                            { start_date: { '$regex': new RegExp(search, "i") } },
                            { end_date: { '$regex': new RegExp(search, "i") } },
                            { invoice_no: { '$regex': new RegExp(search, "i") } }
                        ],
                        eventId: { $in: eventIds },
                        ...bookingquery
                    }, {
                        page,
                        limit: parseInt(limit),
                        sort: { _id: -1 },
                        populate: { path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: 'name email mobile country_code profile_pic' },
                        lean: true
                    }).then((bookedEvenets) => {
                        return responseManager.onSuccess("event booked list...", bookedEvenets, res);
                    }).catch((error) => {
                        return responseManager.onError(error, res);
                    });
                })().catch((error) => {
                    return responseManager.onError(error, res);
                });
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get booking list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};