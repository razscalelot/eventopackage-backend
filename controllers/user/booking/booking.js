const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const mongoose = require('mongoose');
exports.booking = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { bookingid, eventid, start_date, end_date, start_time, end_time } = req.body;
            if (bookingid && bookingid != '' && mongoose.Types.ObjectId.isValid(bookingid)){
                if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                    if (start_date && start_date != '' && end_date && end_date != '') {
                        if (start_time && start_time != '' && end_time && end_time != '') {
                            let xstart_date = start_date.split("-");
                            let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + start_time).getTime();
                            let yend_date = end_date.split("-");
                            let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + end_time).getTime();
                            let existingBookingEvent = await primary.model(constants.MODELS.eventbookings, eventbookingModel).findOne({ eventid: mongoose.Types.ObjectId(eventid), start_date: start_date, end_date: end_date, start_time: start_time, end_time: end_time}).lean();
                            if (existingBookingEvent == null) {
                                let obj = {
                                    start_date: start_date,
                                    end_date: end_date,
                                    start_time: start_time,
                                    end_time: end_time,
                                    about_event: about_event,
                                    start_timestamp: startTimestamp,
                                    end_timestamp: endTimestamp,
                                };
                                await primary.model(constants.MODELS.eventbookings, eventbookingModel).findByIdAndUpdate(bookingid, obj);
                                let bookingEventData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).findById(bookingid).lean();
                                if(bookingEventData && bookingEventData != null){
                                    return responseManager.onSuccess('Event Book successfully!', bookingEventData, res);
                                }else{
                                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                                }
                            }else{
                                return responseManager.badrequest({message : 'On this date and time event already booked, Please try again...'}, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid start or end time for event about data, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid start or end date for event about data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            }else{
                if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                    if (start_date && start_date != '' && end_date && end_date != '') {
                        if (start_time && start_time != '' && end_time && end_time != '') {
                            let xstart_date = start_date.split("-");
                            let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + start_time).getTime();
                            let yend_date = end_date.split("-");
                            let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + end_time).getTime();
                            let existingBookingEvent = await primary.model(constants.MODELS.eventbookings, eventbookingModel).findOne({ eventid: mongoose.Types.ObjectId(eventid), start_date: start_date, end_date: end_date, start_time: start_time, end_time: end_time}).lean();
                            if (existingBookingEvent && existingBookingEvent != null) {
                                let obj = {
                                    start_date: start_date,
                                    end_date: end_date,
                                    start_time: start_time,
                                    end_time: end_time,
                                    about_event: about_event,
                                    start_timestamp: startTimestamp,
                                    end_timestamp: endTimestamp,
                                };
                                await primary.model(constants.MODELS.eventbookings, eventbookingModel).create(obj);
                                let bookingEventData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).findById(bookingid).lean();
                                if(bookingEventData && bookingEventData != null){
                                    return responseManager.onSuccess('Event Book successfully!', bookingEventData, res);
                                }else{
                                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                                }
                            }else{
                                return responseManager.badrequest({message : 'On this date and time event already booked, Please try again...'}, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid start or end time for event about data, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid start or end date for event about data, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid user id to book event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to book event data, please try again' }, res);
    }
};