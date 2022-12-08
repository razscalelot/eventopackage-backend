const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.selectusertype = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationid, usertype } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (notificationData.usertype && notificationData.usertype == usertype) {
                        return responseManager.onSuccess('Promotion user type set successfully', notificationData, res);
                    } else {
                        if (usertype == 'eventusers' || usertype == 'shopusers' || usertype == 'onlineofferusers' || usertype == 'livestreamusers' || usertype == 'allusers' || usertype == 'existingusers') {
                            await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, { $unset: { numberofusers: 1, published_location: 1, selected_plan: 1, is_selected_all: 1, selected_users: 1 }, usertype: usertype });
                            let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                            return responseManager.onSuccess('Promotion user type set successfully', updatednotificationData, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid notification usertype allowed types are eventuser, shopuser, onlineofferuser, livestreamuser, alluser and existinguser, please try again' }, res);
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