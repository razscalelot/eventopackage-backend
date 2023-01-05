const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const userModel = require('../../../models/users.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const async = require("async");
const mongoose = require('mongoose');
exports.booking = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { user, eventId, trans_Id, name, url, category_name, address, payment_status, selectedItems, selectedEquipments, selectedServices, totalPrice, start_date, end_date, start_time, end_time } = req.body;
            if (user && user != '' && mongoose.Types.ObjectId.isValid(user) && eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                if (start_date && end_date && start_time && end_time) {
                    let totalInvoice = parseInt(await primary.model(constants.MODELS.eventbookings, eventbookingModel).countDocuments({}));
                    let invoiceNo = helper.getInvoiceNo(totalInvoice);
                    let finalItems = [];
                    let finalEquipments = [];
                    let finalServices = [];
                    async.forEachSeries(selectedItems, (item, next_item) => {
                        if (item._id && item._id != '' && mongoose.Types.ObjectId.isValid(item._id)) {
                            item._id = mongoose.Types.ObjectId(item._id);
                            finalItems.push(item);
                        }
                        next_item();
                    }, () => {
                        async.forEachSeries(selectedEquipments, (equipment, next_equipment) => {
                            if (equipment._id && equipment._id != '' && mongoose.Types.ObjectId.isValid(equipment._id)) {
                                equipment._id = mongoose.Types.ObjectId(equipment._id);
                                finalEquipments.push(equipment);
                            }
                            next_equipment();
                        }, () => {
                            async.forEachSeries(selectedServices, (service, next_service) => {
                                if (service._id && service._id != '' && mongoose.Types.ObjectId.isValid(service._id)) {
                                    service._id = mongoose.Types.ObjectId(service._id);
                                    finalServices.push(service);
                                }
                                next_service();
                            }, () => {
                                (async () => {
                                    let xstart_date = start_date.split("-");
                                    let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + start_time).getTime();
                                    let yend_date = end_date.split("-");
                                    let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + end_time).getTime();
                                    let obj = {
                                        userid: mongoose.Types.ObjectId(user),
                                        eventId: mongoose.Types.ObjectId(eventId),
                                        trans_Id: trans_Id,
                                        name: name,
                                        url: url,
                                        invoice_no: invoiceNo,
                                        category_name: category_name,
                                        address: address,
                                        payment_status: payment_status,
                                        selectedItems: finalItems,
                                        selectedEquipments: finalEquipments,
                                        selectedServices: finalServices,
                                        totalPrice: parseFloat(totalPrice),
                                        start_date: start_date,
                                        end_date: end_date,
                                        start_time: start_time,
                                        end_time: end_time,
                                        isUserReview: false,
                                        start_timestamp: startTimestamp,
                                        end_timestamp: endTimestamp
                                    };
                                    let output = await primary.model(constants.MODELS.eventbookings, eventbookingModel).create(obj);
                                    let currentuserreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({ userid: mongoose.Types.ObjectId(req.token.userid), eventid: mongoose.Types.ObjectId(output.eventId) }).sort({ _id: -1 }).lean();
                                    output.isUserReview = (currentuserreview == null) ? false : true
                                    return responseManager.onSuccess('Event Book successfully!', output, res);
                                })().catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            });
                        });
                    });
                } else {
                    return responseManager.badrequest({ message: 'Invalid start or end date time to book event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid user id or event id to book event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid user id to book event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to book event data, please try again' }, res);
    }
};
exports.calendar = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventId } = req.body;
            if (eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                let today = new Date();
                let i = 1;
                let finalObj = [];
                for (i = 1; i <= 365; i++) {
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
                                        { start_timestamp : { $gte: start }}, { start_timestamp : { $lte: end }}, 
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
                return responseManager.badrequest({ message: 'Invalid user data to check event booking availability, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
    }
};
exports.checkavailability = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
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
            return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
        }
    }
};
exports.bookinglist = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let eventData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ userid: mongoose.Types.ObjectId(req.token.userid) }).sort({ _id: -1 }).lean();
            if (eventData && eventData != null) {
                let allEvents = [];
                async.forEachSeries(eventData, (event, next_event) => {
                    (async () => {
                        let currentuserreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({ userid: mongoose.Types.ObjectId(req.token.userid), eventid: mongoose.Types.ObjectId(event.eventId) }).sort({ _id: -1 }).lean();
                        event.isUserReview = (currentuserreview == null) ? false : true
                        allEvents.push(event);
                        next_event();
                    })().catch((error) => { });
                }, () => {
                    return responseManager.onSuccess('Booking list data!', allEvents, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event discount details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};