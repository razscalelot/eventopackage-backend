const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const customerimportModel = require("../../../models/customerimports.model");
const organizerModel = require('../../../models/organizers.model');
const promotionexistingusersModel = require('../../../models/promotionexistingusers.model');
const mongoose = require('mongoose');
exports.checkuser = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { notificationid, userid, usertype, selected } = req.body;
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (userid && userid != '' && mongoose.Types.ObjectId.isValid(userid)) {
                        if (usertype == 'exceluser') {
                            let userData = await primary.model(constants.MODELS.customerimports, customerimportModel).findById(userid).lean();
                            if (userData && userData.notificationid.toString() == notificationid.toString()) {
                                await primary.model(constants.MODELS.customerimports, customerimportModel).findByIdAndUpdate(userid, { selected: selected });
                                return responseManager.onSuccess('Promotion user selection status set successfully', 1, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid user id to set user selection status, please try again' }, res);
                            }
                        } else if (usertype == 'organizer') {
                            if (selected == true) {
                                let promotionexistingusers = await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOne({"notificationid" : mongoose.Types.ObjectId(notificationid)}).lean();
                                if(promotionexistingusers && promotionexistingusers != '' && promotionexistingusers != null && promotionexistingusers != undefined){
                                    if(promotionexistingusers.organizers && promotionexistingusers.organizers.length > 0 && !promotionexistingusers.organizers.includes(userid.toString())){
                                        await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOneAndUpdate({"notificationid" : mongoose.Types.ObjectId(notificationid)}, {$push: {organizers: userid.toString()}});
                                    }else{
                                        await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOneAndUpdate({"notificationid" : mongoose.Types.ObjectId(notificationid)}, {organizers: [userid.toString()]});
                                    }
                                }else{
                                    let obj = {
                                        notificationid : new mongoose.Types.ObjectId(notificationid),
                                        organizers : [userid.toString()],
                                        users : []
                                    };
                                    await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).create(obj);
                                    return responseManager.onSuccess('Promotion user selection status set successfully', 1, res);
                                }
                            } else {
                                let promotionexistingusers = await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOne({"notificationid" : mongoose.Types.ObjectId(notificationid)}).lean();
                                if(promotionexistingusers && promotionexistingusers != '' && promotionexistingusers != null && promotionexistingusers != undefined){
                                    if(promotionexistingusers.organizers && promotionexistingusers.organizers.length > 0 && promotionexistingusers.organizers.includes(userid.toString())){
                                        await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOneAndUpdate({"notificationid" : mongoose.Types.ObjectId(notificationid)}, {$pull: {organizers: userid.toString()}});
                                    }
                                }
                                return responseManager.onSuccess('Promotion user deselection status set successfully', 1, res);
                            }
                        } else if (usertype == 'user') {
                            if (selected == true) {
                                let promotionexistingusers = await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOne({"notificationid" : mongoose.Types.ObjectId(notificationid)}).lean();
                                if(promotionexistingusers && promotionexistingusers != '' && promotionexistingusers != null && promotionexistingusers != undefined){
                                    if(promotionexistingusers.users && promotionexistingusers.users.length > 0 && !promotionexistingusers.users.includes(userid.toString())){
                                        await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOneAndUpdate({"notificationid" : mongoose.Types.ObjectId(notificationid)}, {$push: {users: userid.toString()}});
                                    }else{
                                        await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOneAndUpdate({"notificationid" : mongoose.Types.ObjectId(notificationid)}, {users: [userid.toString()]});
                                    }
                                }else{
                                    let obj = {
                                        notificationid : new mongoose.Types.ObjectId(notificationid),
                                        organizers : [],
                                        users : [userid.toString()]
                                    };
                                    await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).create(obj);
                                    return responseManager.onSuccess('Promotion user selection status set successfully', 1, res);
                                }
                            } else {
                                let promotionexistingusers = await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOne({"notificationid" : mongoose.Types.ObjectId(notificationid)}).lean();
                                if(promotionexistingusers && promotionexistingusers != '' && promotionexistingusers != null && promotionexistingusers != undefined){
                                    if(promotionexistingusers.users && promotionexistingusers.users.length > 0 && promotionexistingusers.users.includes(userid.toString())){
                                        await primary.model(constants.MODELS.promotionexistingusers, promotionexistingusersModel).findOneAndUpdate({"notificationid" : mongoose.Types.ObjectId(notificationid)}, {$pull: {users: userid.toString()}});
                                    }
                                }
                                return responseManager.onSuccess('Promotion user deselection status set successfully', 1, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid user type to set user selection status, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid user id to set user selection status, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid notification id to set user selection status, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid notification id to set user selection status, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to set user selection status, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};