const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const customerimportModel = require("../../../models/customerimports.model");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.selectusers = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationid, numberofusers, published_location, selected_plan, is_selected_all } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (notificationData.usertype && (notificationData.usertype == 'eventusers' || notificationData.usertype == 'shopusers' || notificationData.usertype == 'onlineofferusers' || notificationData.usertype == 'livestreamusers')) {
                        let numberofusersInt = (!isNaN(numberofusers)) ? parseInt(numberofusers) : 0;
                        if (numberofusersInt != 0) {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { numberofusers: numberofusersInt });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            return responseManager.onSuccess('Promotion user count set successfully', updatednotificationData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid number of users to set notification user data, please try again' }, res);
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'allusers') {
                        if (selected_plan && selected_plan != '' && mongoose.Types.ObjectId.isValid(selected_plan)) {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { selected_plan: mongoose.Types.ObjectId(selected_plan) });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            return responseManager.onSuccess('Promotion user plan set successfully', updatednotificationData, res);
                        } else if (numberofusers) {
                            let numberofusersInt = (!isNaN(numberofusers)) ? parseInt(numberofusers) : 0;
                            if (numberofusersInt != 0 && published_location != '') {
                                await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { numberofusers: numberofusersInt, published_location: published_location });
                                let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                                return responseManager.onSuccess('Promotion user location and numbers set successfully', updatednotificationData, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid number of users or publish location to set notification user data, please try again' }, res);
                            }
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'existingusers') {
                        if (is_selected_all == true) {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { is_selected_all: is_selected_all });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            return responseManager.onSuccess('Promotion all user set successfully', updatednotificationData, res);
                        } else {
                            let allSelectedUsers = await primary.model(constants.MODELS.customerimports, customerimportModel).find({ notificationid: mongoose.Types.ObjectId(notificationid), selected: true }).lean();
                            if (allSelectedUsers && allSelectedUsers.length > 0) {
                                await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { is_selected_all: false });
                                let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                                return responseManager.onSuccess('Promotion all ids set successfully', updatednotificationData, res);
                            } else {
                                return responseManager.badrequest({ message: 'Please select at least one user to send notification, please try again' }, res);
                            }
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid notification data to set notification user data, please try again' }, res);
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