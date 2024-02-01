const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const eventModel = require('../../../models/events.model');
const categoryModel = require('../../../models/categories.model');
const serviceModel = require('../../../models/service.model');
const equipmentModel = require('../../../models/equipments.model');
const wishlistModel = require('../../../models/eventwishlists.model');
const mongoose = require('mongoose');
const async = require('async');
exports.wishlist = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventid } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let existingwishlist = await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOne({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                if (existingwishlist == null) {
                    let obj = {
                        eventid: mongoose.Types.ObjectId(eventid),
                        userid: mongoose.Types.ObjectId(req.token.userid),
                    };
                    await primary.model(constants.MODELS.eventwishlists, wishlistModel).create(obj);
                    return responseManager.onSuccess("Event wishlist placed successfully!", 1, res);
                } else {
                    await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOneAndRemove({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                    return responseManager.onSuccess("Event wishlist remove successfully!", 1, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id placed to wishlist event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid event id placed to wishlist event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid user id placed to wishlist event data, please try again' }, res);
    }
};
exports.list = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            let mywishlist = await primary.model(constants.MODELS.eventwishlists, wishlistModel).find({userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
            let allEventsId = [];
            async.forEachSeries(mywishlist, (wishlist, next_wishlist) => {
                if(wishlist.eventid && wishlist.eventid != '' && mongoose.Types.ObjectId.isValid(wishlist.eventid)){
                    allEventsId.push(mongoose.Types.ObjectId(wishlist.eventid));
                }
                next_wishlist();
            }, () => {
                primary.model(constants.MODELS.events, eventModel).find({ _id : { $in : allEventsId }}).select("-services -photos -videos -othercost -companydetail -tandc -equipments -discounts -updatedBy -__v").populate([
                    { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name"},
                    { path: 'services', model: primary.model(constants.MODELS.services, serviceModel), select: "-createdBy -updatedBy -eventid -__v"},
                    { path: 'equipments', model: primary.model(constants.MODELS.equipments, equipmentModel)},
                    { path: 'discounts.services', model: primary.model(constants.MODELS.services, serviceModel), select: "-createdBy -updatedBy -eventid -__v"},
                ]).lean().then((result) => {
                    return responseManager.onSuccess("Wishlist List", result, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            });            
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event list, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event list, please try again' }, res);
    }
};
exports.getone = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventid } = req.body
            let mywishlist = await primary.model(constants.MODELS.eventwishlists, wishlistModel).find({eventid : mongoose.Types.ObjectId(eventid)}).lean();
            let allEventsId = [];
            async.forEachSeries(mywishlist, (wishlist, next_wishlist) => {
                if(wishlist.eventid && wishlist.eventid != '' && mongoose.Types.ObjectId.isValid(wishlist.eventid)){
                    allEventsId.push(mongoose.Types.ObjectId(wishlist.eventid));
                }
                next_wishlist();
            }, () => {
                primary.model(constants.MODELS.events, eventModel).find({ _id : { $in : allEventsId }}).populate([
                    { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name"},
                    { path: 'services', model: primary.model(constants.MODELS.services, serviceModel), select: "-createdBy -updatedBy -eventid -__v"},
                    { path: 'equipments', model: primary.model(constants.MODELS.equipments, equipmentModel)},
                    { path: 'discounts.services', model: primary.model(constants.MODELS.services, serviceModel), select: "-createdBy -updatedBy -eventid -__v"},
                ]).lean().then((result) => {
                    return responseManager.onSuccess("Wishlist List", result, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            });  
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event list, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event list, please try again' }, res);
    }
};
exports.remove = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if(userdata && userdata.status == true && userdata.mobileverified == true){
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOneAndRemove({eventid : mongoose.Types.ObjectId(eventid)});
                return responseManager.onSuccess('Wishlist removed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid wishlistid to remove event, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid userid to remove event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create or remove wishlist, please try again' }, res);
    }
};