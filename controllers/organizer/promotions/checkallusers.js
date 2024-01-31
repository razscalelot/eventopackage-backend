const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const customerimportModel = require("../../../models/customerimports.model");
const organizerModel = require('../../../models/organizers.model');
const userModel = require('../../../models/users.model');
const promotionexistingusersModel = require('../../../models/promotionexistingusers.model');
const mongoose = require('mongoose');
exports.checkalluser = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { notificationid, is_selected_all } = req.body;
            if(notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)){
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if(is_selected_all == true){
                        await primary.model(constants.MODELS.customerimports, customerimportModel).updateMany({notificationid : mongoose.Types.ObjectId(notificationid)}, {selected : true});
                        let finalOraganizer = [];
                        let finalUser = [];
                        let allOrganisers = await primary.model(constants.MODELS.organizers, organizerModel).find({"mobileverified" : true, "is_approved" : true}).select('_id').lean();
                        let allUsers = await primary.model(constants.MODELS.users, userModel).find({"mobileverified" : true, "status" : true}).select('_id').lean();
                        async.forEachSeries(allOrganisers, (organizer, next_organizer) => {
                            finalOraganizer.push(organizer._id.toString());
                            next_organizer();
                        }, () => {
                            async.forEachSeries(allUsers, (user, next_user) => {
                                finalUser.push(user._id.toString());
                                next_user();
                            }, () => {
                                ( async () => {
                                    let existingpromotionexistingusers = await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOne({"notificationid" : mongoose.Types.ObjectId(notificationid)}).lean();
                                    if(existingpromotionexistingusers && existingpromotionexistingusers != null && existingpromotionexistingusers != undefined){
                                        await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findByIdAndUpdate(existingpromotionexistingusers._id, {organizers : finalOraganizer, users : finalUser});
                                    }else{
                                        let obj = {
                                            notificationid : new mongoose.Types.ObjectId(notificationid),
                                            organizers : finalOraganizer,
                                            users : finalUser
                                        };
                                        await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).create(obj);
                                    }
                                    return responseManager.onSuccess('Promotion all users selected successfully', 1, res);
                                })().catch((error) => {});
                            });
                        });
                    }else if(is_selected_all == false){
                        await primary.model(constants.MODELS.customerimports, customerimportModel).updateMany({notificationid : mongoose.Types.ObjectId(notificationid)}, {selected : false});
                        let existingpromotionexistingusers = await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOne({"notificationid" : mongoose.Types.ObjectId(notificationid)}).lean();
                        if(existingpromotionexistingusers && existingpromotionexistingusers != null && existingpromotionexistingusers != undefined){
                            await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findByIdAndUpdate(existingpromotionexistingusers._id, {organizers : [], users : []});
                        }
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