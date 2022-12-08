const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const customerimportModel = require("../../../models/customerimports.model");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.checkuser = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationid, userid, selected } = req.body;
            if(notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)){
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if(userid && userid != '' && mongoose.Types.ObjectId.isValid(userid)){
                        let userData = await primary.model(constants.MODELS.customerimports, customerimportModel).findById(userid).lean();
                        if(userData && userData.notificationid.toString() == notificationid.toString()){
                            await primary.model(constants.MODELS.customerimports, customerimportModel).findByIdAndUpdate(userid, {selected : selected});
                            return responseManager.onSuccess('Promotion user selection status set successfully', 1, res);
                        }else{
                            return responseManager.badrequest({ message: 'Invalid user id to set user selection status, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid user id to set user selection status, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to set user selection status, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid notification id to set user selection status, please try again' }, res);
            }
        }else {
            return responseManager.badrequest({ message: 'Invalid organizerid to set user selection status, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};