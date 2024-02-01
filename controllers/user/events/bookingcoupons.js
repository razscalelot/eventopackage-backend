const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const eventbookingcouponModel = require('../../../models/eventbookingcoupons.model');
const userModel = require('../../../models/users.model');
const mongoose = require('mongoose');
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if (userData && userData.status == true && userData.mobileverified == true) {
            primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).find({ 
                status: true
            }).sort({_id: -1}).lean().then((eventbookingcouponlist) => {
                return responseManager.onSuccess('Event booking coupon list!', eventbookingcouponlist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event booking coupons list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};
exports.getone = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if (userData && userData.status == true && userData.mobileverified == true) {
            const { eventbookingcouponid } = req.body;
            if (eventbookingcouponid && eventbookingcouponid != '' && mongoose.Types.ObjectId.isValid(eventbookingcouponid)) {
                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                primary.model(constants.MODELS.eventbookingcoupons, eventbookingcouponModel).findById(eventbookingcouponid).lean().then((eventbookingcoupons) => {
                    return responseManager.onSuccess('Event booking coupon data!', eventbookingcoupons, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.unauthorisedRequest(res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event booking coupon, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};