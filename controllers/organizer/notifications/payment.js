const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const notificationModel = require('../../../models/notifications.model');
const notificationcouponModel = require('../../../models/notificationcoupons.model'); 
const customerimportModel = require('../../../models/customerimports.model');
const settingModel = require('../../../models/settings.model');
const mongoose = require('mongoose');
exports.paynow = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        const { notificationid, notification_amt, sms_amt, email_amt, discount_coupon, total } = req.query;
        var bk_notificationcost = 0;
        var bk_emailcost = 0;
        var bk_smscost = 0;
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)) {
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if (notificationData && notificationData.payment == false && notificationData.createdBy.toString() == req.token.organizerid.toString()) {
                    if (notificationData.usertype && (notificationData.usertype == 'eventusers' || notificationData.usertype == 'shopusers' || notificationData.usertype == 'onlineofferusers' || notificationData.usertype == 'livestreamusers')) {
                        let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                        if (defaultSetting && defaultSetting.length > 0 && notificationData.numberofusers && !isNaN(notificationData.numberofusers)) {
                            if(notificationData.is_notification){
                                bk_notificationcost = parseFloat(parseInt(notificationData.numberofusers) * parseFloat(defaultSetting.notificationcost));
                            }
                            if(notificationData.is_email){
                                bk_emailcost = parseFloat(parseInt(notificationData.numberofusers) * parseFloat(defaultSetting.emailcost));
                            }
                            if(notificationData.is_sms){
                                bk_smscost = parseFloat(parseInt(notificationData.numberofusers) * parseFloat(defaultSetting.smscost));
                            }
                            let bk_total = parseFloat(bk_notificationcost + bk_emailcost + bk_smscost);
                            if(discount_coupon && discount_coupon != '' && mongoose.Types.ObjectId.isValid(discount_coupon)){
                                let discountData = await primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).findById(discount_coupon).lean();
                                if (discountData){
                                    if(discountData.amount && discountData.amount != '' && discountData.amount != 0 && !isNaN(discountData.amount)){
                                        bk_total = bk_total - parseFloat(discountData.amount); 
                                    }else if(discountData.percentage && discountData.percentage != '' && discountData.percentage != 0 && !isNaN(discountData.percentage)){
                                        let per = (bk_total * parseFloat(discountData.percentage)) / 100;
                                        bk_total = bk_total - parseFloat(per);
                                    }
                                    if(parseFloat(total) == parseFloat(bk_total) && parseFloat(notification_amt) == parseFloat(bk_notificationcost) && parseFloat(sms_amt) == parseFloat(bk_smscost) && parseFloat(email_amt) == parseFloat(bk_emailcost)){
                                        // total match
                                    }else{
                                        // total not match
                                    }
                                }else{
                                    // dicount not apply
                                }
                            }else{
                                // dicount not apply
                            }
                            return responseManager.onSuccess('Promotion schedule set successfully', {settings : defaultSetting, numberofusers : notificationData.numberofusers}, res);
                        } else {
                            return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'allusers') {
                        if (notificationData.selected_plan && notificationData.selected_plan != '' && mongoose.Types.ObjectId.isValid(notificationData.selected_plan)) {
                            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                            let planData = await primary.model(constants.MODELS.promotionplans, promotionplanModel).findById(notificationData.selected_plan).lean();
                            if (defaultSetting && defaultSetting.length > 0) {
                                return responseManager.onSuccess('Promotion schedule set successfully', {settings : defaultSetting, planData : planData}, res);
                            } else {
                                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                            }
                        } else if (numberofusers) {
                            let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                            if (defaultSetting && defaultSetting.length > 0) {
                                return responseManager.onSuccess('Promotion schedule set successfully', {settings : defaultSetting, numberofusers : notificationData.numberofusers}, res);
                            } else {
                                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                            }
                        }
                    } else if (notificationData.usertype && notificationData.usertype == 'existingusers') {
                        let numberofusers = await primary.model(constants.MODELS.customerimports, customerimportModel).countDocuments({ notificationid: mongoose.Types.ObjectId(notificationid), selected: true });
                        let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                        if(numberofusers && numberofusers != '' && !isNaN(numberofusers) && parseInt(numberofusers) > 0){
                            if (defaultSetting && defaultSetting.length > 0) {
                                if(notificationData.is_notification){
                                    bk_notificationcost = parseFloat(parseInt(numberofusers) * parseFloat(defaultSetting.notificationcost));
                                }
                                if(notificationData.is_email){
                                    bk_emailcost = parseFloat(parseInt(numberofusers) * parseFloat(defaultSetting.emailcost));
                                }
                                if(notificationData.is_sms){
                                    bk_smscost = parseFloat(parseInt(numberofusers) * parseFloat(defaultSetting.smscost));
                                }
                                let bk_total = parseFloat(bk_notificationcost + bk_emailcost + bk_smscost);
                                if(discount_coupon && discount_coupon != '' && mongoose.Types.ObjectId.isValid(discount_coupon)){
                                    let discountData = await primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).findById(discount_coupon).lean();
                                    if (discountData){
                                        if(discountData.amount && discountData.amount != '' && discountData.amount != 0 && !isNaN(discountData.amount)){
                                            bk_total = bk_total - parseFloat(discountData.amount); 
                                        }else if(discountData.percentage && discountData.percentage != '' && discountData.percentage != 0 && !isNaN(discountData.percentage)){
                                            let per = (bk_total * parseFloat(discountData.percentage)) / 100;
                                            bk_total = bk_total - parseFloat(per);
                                        }
                                        if(parseFloat(total) == parseFloat(bk_total) && parseFloat(notification_amt) == parseFloat(bk_notificationcost) && parseFloat(sms_amt) == parseFloat(bk_smscost) && parseFloat(email_amt) == parseFloat(bk_emailcost)){
                                            // total match
                                        }else{
                                            // total not match
                                        }
                                    }else{
                                        if(parseFloat(total) == parseFloat(bk_total) && parseFloat(notification_amt) == parseFloat(bk_notificationcost) && parseFloat(sms_amt) == parseFloat(bk_smscost) && parseFloat(email_amt) == parseFloat(bk_emailcost)){
                                            // total match
                                        }else{
                                            // total not match
                                        }
                                        // dicount not apply
                                    }
                                }else{
                                    if(parseFloat(total) == parseFloat(bk_total) && parseFloat(notification_amt) == parseFloat(bk_notificationcost) && parseFloat(sms_amt) == parseFloat(bk_smscost) && parseFloat(email_amt) == parseFloat(bk_emailcost)){
                                        // total match
                                    }else{
                                        // total not match
                                    }
                                    // dicount not apply
                                }
                                //return responseManager.onSuccess('Promotion schedule set successfully', {settings : defaultSetting, numberofusers : numberofusers}, res);
                            } else {
                                return responseManager.badrequest({ message: 'Something went wrong, please try again' }, res);
                            }
                        }else{
                            // no user selected
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid notification data to set notification user data, please try again' }, res);
                    }
                }
            } else {
                let defaultSetting = await primary.model(constants.MODELS.settings, settingModel).find({}).lean();
                if (defaultSetting && defaultSetting.length > 0) {
                    return responseManager.onSuccess('Promotion schedule set successfully', defaultSetting, res);
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