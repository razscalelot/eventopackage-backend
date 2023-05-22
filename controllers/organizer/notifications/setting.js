const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const notificationModel = require('../../../models/notifications.model');
const settingModel = require('../../../models/settings.model');
const customerimportModel = require('../../../models/customerimports.model');
const promotionplanModel = require('../../../models/promotionplans.model');
const mongoose = require('mongoose');
exports.getsettings = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        const { notificationid } = req.query;
        console.log('notificationid', notificationid);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            console.log('11111111');
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                console.log('22222');
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    console.log('333333');
                    if (notificationData.usertype && (notificationData.usertype == 'haveyouplace' || notificationData.usertype == 'personalskillsbusiness' || notificationData.usertype == 'groupskillsbusiness')) {
                        console.log('444444');
                        let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                        if (defaultSetting && defaultSetting.length > 0) {
                            console.log('555555',{settings : defaultSetting, numberofusers : notificationData.numberofusers});
                            return responseManager.onSuccess('settings data', {settings : defaultSetting, numberofusers : notificationData.numberofusers}, res);
                        } else {
                            console.log('666666');
                            return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'allusers') {
                        console.log('777777', notificationData);
                        if (notificationData.selected_plan && notificationData.selected_plan != '' && mongoose.Types.ObjectId.isValid(notificationData.selected_plan)) {
                            console.log('888888');
                            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                            let planData = await primary.model(constants.MODELS.promotionplans, promotionplanModel).findById(notificationData.selected_plan).lean();
                            if (defaultSetting && defaultSetting.length > 0) {
                                console.log('999999',{settings : defaultSetting, planData : planData});
                                return responseManager.onSuccess('settings data', {settings : defaultSetting, planData : planData}, res);
                            } else {
                                console.log('101010');
                                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                            }
                        } else if (notificationData.numberofusers) {
                            console.log('AAAAAA');
                            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                            if (defaultSetting && defaultSetting.length > 0) {
                                console.log('BBBBBb',{settings : defaultSetting, numberofusers : notificationData.numberofusers});
                                return responseManager.onSuccess('settings data', {settings : defaultSetting, numberofusers : notificationData.numberofusers}, res);
                            } else {
                                console.log('CCCCC');
                                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                            }
                        }else{
                            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                            if (defaultSetting && defaultSetting.length > 0) {
                                return responseManager.onSuccess('settings data', {settings : defaultSetting}, res);
                            } else {
                                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                            }
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'existingusers') {
                        console.log('DDDDD');
                        let numberofusers = await primary.model(constants.MODELS.customerimports, customerimportModel).countDocuments({ notificationid: mongoose.Types.ObjectId(notificationid), selected: true });
                        let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                        if (defaultSetting && defaultSetting.length > 0) {
                            console.log('EEEEE',{settings : defaultSetting, numberofusers : numberofusers});
                            return responseManager.onSuccess('settings data', {settings : defaultSetting, numberofusers : numberofusers}, res);
                        } else {
                            console.log('FFFFF');
                            return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                        }
                    } else {
                        console.log('GGGGG');
                        return responseManager.badrequest({ message: 'Invalid notification data to set notification user data, please try again' }, res);
                    }
                }else{
                    console.log('HHHHH');
                    console.log('notificationData', notificationData);
                }
            } else {
                let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                if (defaultSetting && defaultSetting.length > 0) {
                    return responseManager.onSuccess('settings data', defaultSetting, res);
                } else {
                    return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get settings data, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};