const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationid } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData != null) {
                    return responseManager.onSuccess('Notification data!', notificationData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to get notification data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid notification id to get notification data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get notification data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};