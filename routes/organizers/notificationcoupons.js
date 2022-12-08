let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const notificationcouponModel = require('../../models/notificationcoupons.model');
const organizerModel = require('../../models/organizers.model');
const mongoose = require('mongoose');
router.get('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).find({ 
                status: true
            }).lean().then((notificationcouponslist) => {
                return responseManager.onSuccess('Notification coupon list!', notificationcouponslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get notification coupons list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { notificationcouponid } = req.body;
            if (notificationcouponid && notificationcouponid != '' && mongoose.Types.ObjectId.isValid(notificationcouponid)) {
                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                primary.model(constants.MODELS.notificationcoupons, notificationcouponModel).findById(notificationcouponid).lean().then((notificationcoupon) => {
                    return responseManager.onSuccess('Notification coupon data!', notificationcoupon, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.unauthorisedRequest(res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get notification coupon, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;