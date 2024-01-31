const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const organizerModel = require('../../../models/organizers.model');
const settingModel = require('../../../models/settings.model');
const mongoose = require('mongoose');
exports.setschedule = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { notificationid, notification_date, notification_time, is_notification, is_email, is_sms } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (notificationData.payment == false) {
                        let newdate = notification_date + ' ' + notification_time;
                        const finalDate = new Date(newdate);
                        let notification_timestamp = finalDate.getTime();
                        await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, {
                            notification_date: notification_date,
                            notification_time: notification_time,
                            notification_timestamp: notification_timestamp,
                            is_notification: is_notification,
                            is_email: is_email,
                            is_sms: is_sms
                        });
                        let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                        let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                        if(defaultSetting && defaultSetting.length > 0){
                            return responseManager.onSuccess('Promotion schedule set successfully', { notification : updatednotificationData, setting : defaultSetting}, res);
                        }else{
                            return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                        }                      
                    } else {
                        let newdate = notification_date + ' ' + notification_time;
                        const finalDate = new Date(newdate);
                        let notification_timestamp = finalDate.getTime();
                        await primary.model(constants.MODELS.notifications, notificationModel).findByIdAndUpdate(notificationid, {
                            notification_date: notification_date,
                            notification_time: notification_time,
                            notification_timestamp: notification_timestamp
                        });
                        let updatednotificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                        return responseManager.onSuccess('Promotion schedule set successfully', updatednotificationData, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to set notification schedule, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid notification id to set notification schedule, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to set notification schedule, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};