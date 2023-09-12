const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const organizerModel = require('../../../models/organizers.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const userModel = require('../../../models/users.model');
const customerimportsModel = require('../../../models/customerimports.model');
const promotionexistingusersModel = require('../../../models/promotionexistingusers.model');
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
                                let totalhaveyouplaceusers = parseInt(haveyouplaceusers.length);
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
                                let totalOrganisers = await primary.model(constants.MODELS.organizers, organizerModel).find({"mobileverified" : true, "is_approved" : true}).select('_id name email mobile').lean();
                                let totalUsers = await primary.model(constants.MODELS.users, userModel).find({"mobileverified" : true, "status" : true}).select('_id name email mobile').lean();
                                let total = parseInt(parseInt(totalOrganisers.length) + parseInt(totalUsers.length));
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, totalusers: parseInt(total) }, res);                              
                            } else if (usertype == 'existingusers') {
                                let alreadyImportedCustomers = await primary.model(constants.MODELS.customerimports, customerimportsModel).find({notificationid : mongoose.Types.ObjectId(notificationid)}).lean();
                                let allOrganisers = await primary.model(constants.MODELS.organizers, organizerModel).find({"mobileverified" : true, "is_approved" : true}).select('_id name email country_code mobile profile_pic').lean();
                                let allUsers = await primary.model(constants.MODELS.users, userModel).find({"mobileverified" : true, "status" : true}).select('_id name email country_code mobile profilepic').lean();
                                let alreadyselectedusersandorg = await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOne({notificationid : mongoose.Types.ObjectId(notificationid)}).lean();
                                if(alreadyselectedusersandorg && alreadyselectedusersandorg != null && alreadyselectedusersandorg != undefined){
                                    let finalOrganiser = [];
                                    let finalUser = [];
                                    async.forEachSeries(allOrganisers, (organizer, next_organizer) => {
                                        if(alreadyselectedusersandorg && alreadyselectedusersandorg.organizers && alreadyselectedusersandorg.organizers.length > 0 && alreadyselectedusersandorg.organizers.includes(organizer._id.toString())){
                                            organizer.selected = true;
                                        }else{
                                            organizer.selected = false;
                                        }
                                        finalOrganiser.push(organizer);
                                        next_organizer();
                                    }, () => {
                                        async.forEachSeries(allUsers, (user, next_user) => {
                                            if(alreadyselectedusersandorg && alreadyselectedusersandorg.users && alreadyselectedusersandorg.users.length > 0 && alreadyselectedusersandorg.users.includes(user._id.toString())){
                                                user.selected = true;
                                            }else{
                                                user.selected = false;
                                            }
                                            finalUser.push(user);
                                            next_user();
                                        }, () => {
                                            return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, exceluser : alreadyImportedCustomers, organizer : finalOrganiser, user : finalUser}, res);
                                        });
                                    });
                                }else{
                                    let finalOrganiser = [];
                                    let finalUser = [];
                                    async.forEachSeries(allOrganisers, (organizer, next_organizer) => {
                                        organizer.selected = false;
                                        finalOrganiser.push(organizer);
                                        next_organizer();
                                    }, () => {
                                        async.forEachSeries(allUsers, (user, next_user) => {
                                            user.selected = false;
                                            finalUser.push(user);
                                            next_user();
                                        }, () => {
                                            return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, exceluser : alreadyImportedCustomers, organizer : finalOrganiser, user : finalUser}, res);
                                        });
                                    });
                                }
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
                                let totalhaveyouplaceusers = parseInt(haveyouplaceusers.length);
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: updatednotificationData, totalhaveyouplaceusers: totalhaveyouplaceusers }, res);
                            } else if (usertype == 'personalskillsbusiness') {
                                let personalskillsbusinessusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_type: 'personal_skills_business' }).select('userid').distinct('userid').lean();
                                let totalpersonalskillsbusinessusers = parseInt(personalskillsbusinessusers.length);
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: updatednotificationData, totalpersonalskillsbusinessusers: totalpersonalskillsbusinessusers }, res);
                            } else if (usertype == 'groupskillsbusiness') {
                                let groupskillsbusinessusers = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ event_type: 'group_skills_business' }).select('userid').distinct('userid').lean();
                                let totalgroupskillsbusinessusers = parseInt(groupskillsbusinessusers.length);
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: updatednotificationData, totalgroupskillsbusinessusers: totalgroupskillsbusinessusers }, res);
                            } else if (usertype == 'allusers') {
                                let totalOrganisers = await primary.model(constants.MODELS.organizers, organizerModel).find({"mobileverified" : true, "is_approved" : true}).select('_id name email mobile').lean();
                                let totalUsers = await primary.model(constants.MODELS.users, userModel).find({"mobileverified" : true, "status" : true}).select('_id name email mobile').lean();
                                let total = parseInt(parseInt(totalOrganisers.length) + parseInt(totalUsers.length));
                                return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: updatednotificationData, totalusers: parseInt(total) }, res);
                            } else if (usertype == 'existingusers') {
                                let alreadyImportedCustomers = await primary.model(constants.MODELS.customerimports, customerimportsModel).find({notificationid : mongoose.Types.ObjectId(notificationid)}).lean();
                                let allOrganisers = await primary.model(constants.MODELS.organizers, organizerModel).find({"mobileverified" : true, "is_approved" : true}).select('_id name email country_code mobile profile_pic').lean();
                                let allUsers = await primary.model(constants.MODELS.users, userModel).find({"mobileverified" : true, "status" : true}).select('_id name email country_code mobile profilepic').lean();
                                let alreadyselectedusersandorg = await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOne({notificationid : mongoose.Types.ObjectId(notificationid)}).lean();
                                if(alreadyselectedusersandorg && alreadyselectedusersandorg != null && alreadyselectedusersandorg != undefined){
                                    let finalOrganiser = [];
                                    let finalUser = [];
                                    async.forEachSeries(allOrganisers, (organizer, next_organizer) => {
                                        if(alreadyselectedusersandorg && alreadyselectedusersandorg.organizers && alreadyselectedusersandorg.organizers.length > 0 && alreadyselectedusersandorg.organizers.includes(organizer._id.toString())){
                                            organizer.selected = true;
                                        }else{
                                            organizer.selected = false;
                                        }
                                        finalOrganiser.push(organizer);
                                        next_organizer();
                                    }, () => {
                                        async.forEachSeries(allUsers, (user, next_user) => {
                                            if(alreadyselectedusersandorg && alreadyselectedusersandorg.users && alreadyselectedusersandorg.users.length > 0 && alreadyselectedusersandorg.users.includes(user._id.toString())){
                                                user.selected = true;
                                            }else{
                                                user.selected = false;
                                            }
                                            finalUser.push(user);
                                            next_user();
                                        }, () => {
                                            return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, exceluser : alreadyImportedCustomers, organizer : finalOrganiser, user : finalUser}, res);
                                        });
                                    });
                                }else{
                                    let finalOrganiser = [];
                                    let finalUser = [];
                                    async.forEachSeries(allOrganisers, (organizer, next_organizer) => {
                                        organizer.selected = false;
                                        finalOrganiser.push(organizer);
                                        next_organizer();
                                    }, () => {
                                        async.forEachSeries(allUsers, (user, next_user) => {
                                            user.selected = false;
                                            finalUser.push(user);
                                            next_user();
                                        }, () => {
                                            return responseManager.onSuccess('Promotion user type set successfully', { notificationdata: notificationData, exceluser : alreadyImportedCustomers, organizer : finalOrganiser, user : finalUser}, res);
                                        });
                                    });
                                }
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