const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const organizerModel = require('../../../models/organizers.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const userModel = require('../../../models/users.model');
const async = require('async');
const mongoose = require('mongoose');
exports.selectusertype = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { notificationid, usertype } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (notificationData.usertype && notificationData.usertype == usertype) {
                        if (usertype == 'haveyouplace' || usertype == 'personalskillsbusiness' || usertype == 'groupskillsbusiness' || usertype == 'allusers' || usertype == 'existingusers') {
                            if (usertype == 'haveyouplace') {
                                let haveyouplaceusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_type: 'have_you_places' }).select('userid').distinct('userid').lean();
                                let totalhaveyouplaceusers = parseInt(haveyouplaceusers.length) + 5000;
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, totalhaveyouplaceusers: totalhaveyouplaceusers }, res);
                            } else if (usertype == 'personalskillsbusiness') {
                                let personalskillsbusinessusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_type: 'personal_skills_business' }).select('userid').distinct('userid').lean();
                                let totalpersonalskillsbusinessusers = parseInt(personalskillsbusinessusers.length) + 5000;
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, totalpersonalskillsbusinessusers: totalpersonalskillsbusinessusers }, res);
                            } else if (usertype == 'groupskillsbusiness') {
                                let groupskillsbusinessusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_type: 'group_skills_business' }).select('userid').distinct('userid').lean();
                                let totalgroupskillsbusinessusers = parseInt(groupskillsbusinessusers.length) + 5000;
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, totalgroupskillsbusinessusers: totalgroupskillsbusinessusers }, res);
                            } else if (usertype == 'allusers') {
                                let alleventbookingsusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({}).select('userid').distinct('userid').lean();
                                let userids = [];
                                async.forEachSeries(alleventbookingsusers, (bookingsusers, next_bookingsusers) => {
                                    if (!(userids.includes(bookingsusers.toString()))) {
                                        userids.push(bookingsusers.toString());
                                    }
                                    next_bookingsusers();
                                }, () => {
                                    return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, totalusers: parseInt(userids.length) }, res);
                                });                                
                            } else if (usertype == 'existingusers') {
                                let alleventbookings = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({}).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: 'name email mobile country_code profile_pic' }).lean();
                                let userids = [];
                                let userData = [];
                                async.forEachOfSeries(alleventbookings, (eventuser, next_eventuser) => {
                                    (async () => {
                                        if (!(userids.includes(eventuser.toString()))) {
                                            userids.push(eventuser.toString());
                                            let userdata = await primary.model(constants.MODELS.users, userModel).findById(eventuser.toString()).lean();
                                            userData.push(userdata);
                                        }
                                        next_eventuser();
                                    })().catch((error) => { });
                                }, () => {
                                    return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, totalexistingusers: userData }, res);
                                });
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid notification usertype allowed types are have you places, personal skills business, group skills business, alluser and existinguser, please try again' }, res);
                        }
                    } else {
                        if (usertype == 'haveyouplace' || usertype == 'personalskillsbusiness' || usertype == 'groupskillsbusiness' || usertype == 'allusers' || usertype == 'existingusers') {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { $unset: { numberofusers: 1, published_location: 1, selected_plan: 1, is_selected_all: 1, selected_users: 1 }, usertype: usertype });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            if (usertype == 'haveyouplace') {
                                let haveyouplaceusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_type: 'have_you_places' }).select('userid').distinct('userid').lean();
                                let totalhaveyouplaceusers = parseInt(haveyouplaceusers.length) + 5000;
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: updatednotificationData, totalhaveyouplaceusers: totalhaveyouplaceusers }, res);
                            } else if (usertype == 'personalskillsbusiness') {
                                let personalskillsbusinessusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_type: 'personal_skills_business' }).select('userid').distinct('userid').lean();
                                let totalpersonalskillsbusinessusers = parseInt(personalskillsbusinessusers.length) + 5000;
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: updatednotificationData, totalpersonalskillsbusinessusers: totalpersonalskillsbusinessusers }, res);
                            } else if (usertype == 'groupskillsbusiness') {
                                let groupskillsbusinessusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_type: 'group_skills_business' }).select('userid').distinct('userid').lean();
                                let totalgroupskillsbusinessusers = parseInt(groupskillsbusinessusers.length) + 5000;
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: updatednotificationData, totalgroupskillsbusinessusers: totalgroupskillsbusinessusers }, res);
                            } else if (usertype == 'allusers') {
                                let alleventbookingsusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({}).select('userid').distinct('userid').lean();
                                let userids = [];
                                async.forEachSeries(alleventbookingsusers, (bookingsusers, next_bookingsusers) => {
                                    if (!(userids.includes(bookingsusers.toString()))) {
                                        userids.push(bookingsusers.toString());
                                    }
                                    next_bookingsusers();
                                }, () => {
                                    return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, totalusers: parseInt(userids.length) }, res);
                                });
                            } else if (usertype == 'existingusers') {
                                let alleventbookings = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({}).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: 'name email mobile country_code profile_pic' }).lean();
                                let userids = [];
                                let userData = [];
                                async.forEachOfSeries(alleventbookings, (eventuser, next_eventuser) => {
                                    (async () => {
                                        if (!(userids.includes(eventuser._id.toString()))) {
                                            userids.push(eventuser.toString());
                                            let userdata = await primary.model(constants.MODELS.users, userModel).findById(eventuser.toString()).lean();
                                            userData.push(userdata);
                                        }
                                        next_eventuser();
                                    })().catch((error) => { });
                                }, () => {
                                    return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: updatednotificationData, totalexistingusers: userData }, res);
                                });
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid notification usertype allowed types are have you places, personal skills business, group skills business, alluser and existinguser, please try again' }, res);
                        }
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to set notification user data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid notification id to set notification user data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get set notification user data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};