const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const customerimportModel = require("../../../models/customerimports.model");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.checkalluser = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationid, is_selected_all } = req.body;
            if(notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)){
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if(is_selected_all == true){
                        await primary.model(constants.MODELS.customerimports, customerimportModel).updateMany({notificationid : mongoose.Types.ObjectId(notificationid)}, {selected : true});
                        return responseManager.onSuccess('Promotion all users selected successfully', 1, res);
                    }else if(is_selected_all == false){
                        await primary.model(constants.MODELS.customerimports, customerimportModel).updateMany({notificationid : mongoose.Types.ObjectId(notificationid)}, {selected : false});
                        return responseManager.onSuccess('Promotion all users unselected successfully', 1, res);
                    }else{
                        return responseManager.badrequest({ message: 'Invalid option to select unselect all user, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to set notification user data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid notification id to set notification user data, please try again' }, res);
            }
        }else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get set notification user data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};