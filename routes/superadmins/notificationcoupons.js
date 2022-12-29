let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const notificationcouponModel = require('../../models/notificationcoupons.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).paginate({
                $or: [
                    { code : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                lean: true
            }).then((notificationcoupons) => {
                return responseManager.onSuccess('Notification coupons list!', notificationcoupons, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get notification coupons list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { notificationcouponid, title, code, description, amount, percentage, limit, expiry_date, expiry_time, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(code && code.length > 6){
                if((amount && !isNaN(amount)) || (percentage && !isNaN(percentage))){
                    if((limit && !isNaN(limit)) || (expiry_date && expiry_time)){
                        if(notificationcouponid && notificationcouponid != '' && mongoose.Types.ObjectId.isValid(notificationcouponid)){
                            let existingnotificationcoupon = await primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).findOne({_id : {$ne : notificationcouponid}, code : code}).lean();
                            if(existingnotificationcoupon == null){
                                let newdate = expiry_date + ' ' + expiry_time;
                                const finalDate = new Date(newdate);
                                let timestamp = (expiry_date && expiry_date != '' && expiry_time && expiry_time != '') ? finalDate.getTime() : 0;
                                let obj = {
                                    title: title,
                                    code: code.trim().replace(/\s/g, '').toUpperCase(),
                                    description : description,
                                    amount : amount,
                                    percentage : percentage,
                                    limit : limit,
                                    expiry_date : expiry_date,
                                    expiry_time : expiry_time,
                                    expiry_timestamp : timestamp,
                                    status : status,
                                    updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                                };
                                await primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).findByIdAndUpdate(notificationcouponid, obj);
                                return responseManager.onSuccess('Notification coupon updated sucecssfully!', 1, res);
                            }else{
                                return responseManager.badrequest({ message: 'Notification coupon code can not be identical, please try again' }, res);
                            }
                        }else{
                            let existingnotificationcoupon = await primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).findOne({code : code}).lean();
                            if(existingnotificationcoupon == null) {
                                let newdate = expiry_date + ' ' + expiry_time;
                                const finalDate = new Date(newdate);
                                let timestamp = (expiry_date && expiry_date != '' && expiry_time && expiry_time != '') ? finalDate.getTime() : 0;
                                let obj = {
                                    title: title,
                                    code: code.trim().replace(/\s/g, '').toUpperCase(),
                                    description : description,
                                    amount : parseFloat(amount),
                                    percentage : parseFloat(percentage),
                                    limit : (limit) ? parseInt(limit) : 0,
                                    expiry_date : expiry_date,
                                    expiry_time : expiry_time,
                                    expiry_timestamp : timestamp,
                                    status : status,
                                    total_used : 0,
                                    createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                                    updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                                };
                                await primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).create(obj);
                                return responseManager.onSuccess('Notification coupon created sucecssfully!', 1, res);
                            }else{
                                return responseManager.badrequest({ message: 'Notification coupon code can not be identical, please try again' }, res);
                            }
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Please set limit in days or expiry date time for notification coupon code and try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Notification coupon code amount and percentage value both can not be empty and must be a number, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Notification coupon code must be > 6 chars, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to save Notification coupon code data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token save Notification coupon code data, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { notificationcouponid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(notificationcouponid && notificationcouponid != '' && mongoose.Types.ObjectId.isValid(notificationcouponid)){
                await primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).findByIdAndRemove(notificationcouponid);
                return responseManager.onSuccess('Notification coupon removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid notification coupon id to remove notification coupon data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to remove notification coupon data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).find({}).sort({_id: -1}).then((notificationcouponslist) => {
                return responseManager.onSuccess('notificationcoupons list!', notificationcouponslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get notification coupons list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { notificationcouponid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(notificationcouponid && notificationcouponid != '' && mongoose.Types.ObjectId.isValid(notificationcouponid)){
                let notificationcouponData = await primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).findById(notificationcouponid);
                return responseManager.onSuccess('Notification coupon data!', notificationcouponData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid notification coupon id to get notification coupon data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get notification coupon data, please try again' }, res);
    }
});
module.exports = router;
