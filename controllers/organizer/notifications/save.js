const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.save = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true  && organizerData.is_approved == true) {
            const { notificationid, notification_title, link, banner, description, status } = req.body;
            if (notification_title && link && notification_title.trim() != '' && link.trim() != '') {
                if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                    let obj = {
                        notification_title: notification_title,
                        banner: banner,
                        link: link,
                        description: description,
                        status: status,
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, obj);
                    let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                    if (notificationData && notificationData != null) {
                        return responseManager.onSuccess('Notification updated successfully!', notificationData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid notification id to update notification data, please try again' }, res);
                    }
                } else {
                    let obj = {
                        notification_title: notification_title,
                        banner: banner,
                        link: link,
                        description: description,
                        status: status,
                        payment: false,
                        createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    let createdNotification = await primary.model(constants.MODELS.notifications, notificationModel).create(obj);
                    let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(createdNotification._id).lean();
                    if (notificationData && notificationData != null) {
                        return responseManager.onSuccess('Notification created successfully!', notificationData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid notification data to create notification, please try again' }, res);
                    }
                }
            } else {
                return responseManager.badrequest({ message: 'Notification title and link can not be empty to create notification, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to create or update notification data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};