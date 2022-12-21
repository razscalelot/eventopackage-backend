let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const eventbookingcouponModel = require('../../models/eventbookingcoupons.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).paginate({
                $or: [
                    { code : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                lean: true
            }).then((eventbookingcoupons) => {
                return responseManager.onSuccess('Event booking coupons list!', eventbookingcoupons, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event booking coupons list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventbookingcouponid, code, description, amount, percentage, limit, expiry_date, expiry_time, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(code && code != '' && code.trim() != '' && code.trim().length > 6){
                if((amount && !isNaN(amount)) || (percentage && !isNaN(percentage))){
                    if((limit && !isNaN(limit)) || (expiry_date && expiry_time)){
                        if(eventbookingcouponid && eventbookingcouponid != '' && mongoose.Types.ObjectId.isValid(eventbookingcouponid)){
                            let existingeventbookingcoupon = await primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).findOne({_id : {$ne : eventbookingcouponid}, code : code}).lean();
                            if(existingeventbookingcoupon == null){
                                let newdate = expiry_date + ' ' + expiry_time;
                                const finalDate = new Date(newdate);
                                let timestamp = (expiry_date && expiry_date != '' && expiry_time && expiry_time != '') ? finalDate.getTime() : 0;
                                let obj = {
                                    code : code.trim().replace(/\s/g, '').toUpperCase(),
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
                                await primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).findByIdAndUpdate(eventbookingcouponid, obj);
                                return responseManager.onSuccess('Event booking coupon updated sucecssfully!', 1, res);
                            }else{
                                return responseManager.badrequest({ message: 'Event booking coupon code can not be identical, please try again' }, res);
                            }
                        }else{
                            let existingeventbookingcoupon = await primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).findOne({code : code}).lean();
                            if(existingeventbookingcoupon == null) {
                                let newdate = expiry_date + ' ' + expiry_time;
                                const finalDate = new Date(newdate);
                                let timestamp = (expiry_date && expiry_date != '' && expiry_time && expiry_time != '') ? finalDate.getTime() : 0;
                                let obj = {
                                    code : code.trim().replace(/\s/g, '').toUpperCase(),
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
                                await primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).create(obj);
                                return responseManager.onSuccess('Event booking coupon created sucecssfully!', 1, res);
                            }else{
                                return responseManager.badrequest({ message: 'Event booking coupon code can not be identical, please try again' }, res);
                            }
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Please set limit in days or expiry date time for event booking coupon code and try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Event booking coupon code amount and percentage value both can not be empty and must be a number, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Event booking coupon code must be > 6 chars, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to save Event booking coupon code data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token save Event booking coupon code data, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => { 
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventbookingcouponid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventbookingcouponid && eventbookingcouponid != '' && mongoose.Types.ObjectId.isValid(eventbookingcouponid)){
                await primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).findByIdAndRemove(eventbookingcouponid);
                return responseManager.onSuccess('Event booking coupon removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid Event booking coupon id to remove event booking coupon data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to remove event booking coupon data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).find({}).then((eventbookingcouponslist) => {
                return responseManager.onSuccess('Event booking coupons list!', eventbookingcouponslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event booking coupons list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventbookingcouponid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventbookingcouponid && eventbookingcouponid != '' && mongoose.Types.ObjectId.isValid(eventbookingcouponid)){
                let eventbookingcouponData = await primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).findById(eventbookingcouponid);
                return responseManager.onSuccess('Event booking coupon data!', eventbookingcouponData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid event booking coupon id to get event booking coupon data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event booking coupon data, please try again' }, res);
    }
});
module.exports = router;
