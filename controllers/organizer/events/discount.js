const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const serviceModel = require('../../../models/service.model');
const itemModel = require('../../../models/items.model');
const equipmentModel = require('../../../models/equipments.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
let async = require('async');
exports.getselectservice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                    {path: "services",model: primary.model(constants.MODELS.services, serviceModel),select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "items",model: primary.model(constants.MODELS.items, itemModel),select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "equipments",model: primary.model(constants.MODELS.equipments, equipmentModel),select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                ]).lean();
                if (eventData && eventData != null) {
                    async.forEachSeries(eventData.services, (service, next_service) => {
                        async.forEachSeries(eventData.discounts, (discount, next_discount) => {
                            discount.services.forEach((element) => {
                                if (element._id.toString() == service._id.toString()) {
                                    let totalPrice = parseInt(service.price) - (parseInt(service.price) * parseInt(discount.discount) / 100);
                                    service.totalPrice = totalPrice
                                    service.discount = discount.discount;
                                }
                            });
                            next_discount();
                        });
                        allServices.push(service);
                        next_service();
                    }, () => {
                        async.forEachSeries(eventData.items, (item, next_item) => {
                            async.forEachSeries(eventData.discounts, (discount, next_discount) => {
                                discount.items.forEach((element) => {
                                    if (element._id.toString() == item._id.toString()) {
                                        let totalPrice = parseInt(item.price) - (parseInt(item.price) * parseInt(discount.discount) / 100);
                                        item.totalPrice = totalPrice
                                        item.discount = discount.discount;
                                    }
                                });
                                next_discount();
                            });
                            allItems.push(item);
                            next_item();
                        }, () => {
                            async.forEachSeries(eventData.equipments, (equipment, next_equipment) => {
                                async.forEachSeries(eventData.discounts, (discount, next_discount) => {
                                    discount.equipments.forEach((element) => {
                                        if (element._id.toString() == equipment._id.toString()) {
                                            let totalPrice = parseInt(equipment.price) - (parseInt(equipment.price) * parseInt(discount.discount) / 100);
                                            equipment.totalPrice = totalPrice
                                            equipment.discount = discount.discount;
                                        }
                                    });
                                    next_discount();
                                });
                                allEquipments.push(equipment);
                                next_equipment();
                            }, () => {
                                (async () => {
                                    if (noofreview > 0) {
                                        let totalReviewsCountObj = await primary.model(constants.MODELS.eventreviews, eventreviewModel).aggregate([{ $match: { eventid: mongoose.Types.ObjectId(eventData._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                        if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                            eventData.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                            // allEvents.push(event);
                                        }
                                    } else {
                                        eventData.ratings = '0.0';
                                        // allEvents.push(event);
                                    }
                                    let wishlist = await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOne({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                                    let allreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).find({ eventid: mongoose.Types.ObjectId(eventid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name profile_pic" }).lean();
                                    let currentuserreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({ userid: mongoose.Types.ObjectId(req.token.userid), eventid: mongoose.Types.ObjectId(eventid) }).lean();
                                    eventData.whishlist_status = (wishlist == null) ? false : true
                                    eventData.isUserReview = (currentuserreview == null) ? false : true
                                    eventData.reviews = allreview;
                                    return responseManager.onSuccess('User event data!', eventData, res);
                                })().catch((error) => { });
                            });
                        });
                    });

                    return responseManager.onSuccess('Organizer event data!', 1, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event services details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};
exports.discount = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid, discounts } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let finalDiscount = [];
                if (discounts && discounts.length > 0) {
                    async.forEachSeries(discounts, (discount, next_discount) => {
                        if (discount.services && discount.services.length > 0) {
                            let serviceArray = [];
                            discount.services.forEach(element => {
                                serviceArray.push(mongoose.Types.ObjectId(element));
                            });
                            let xdiscount = { ...discount };
                            xdiscount.services = serviceArray;
                            finalDiscount.push(xdiscount);
                        } else {
                            finalDiscount.push(discount);
                        }
                        next_discount();
                    }, () => {
                        (async () => {
                            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), discounts: finalDiscount });
                                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                                    {path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel)},
                                    {path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel)},
                                    {path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel)},
                                    // select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                                ]).lean();
                                return responseManager.onSuccess('Organizer event discounts data updated successfully!', { _id: eventData._id, discounts: eventData.discounts }, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid event id to add event discounts data, please try again' }, res);
                            }
                        })().catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    });
                }else{
                    finalDiscount.push(discounts);
                    if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), discounts: finalDiscount });
                        let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                            {path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel)},
                            {path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel)},
                            {path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel)},
                            // select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                        ]).lean();
                        return responseManager.onSuccess('Organizer event discounts data updated successfully!', { _id: eventData._id, discounts: eventData.discounts }, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event id to add event discounts data, please try again' }, res);
                    }
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to add event discounts data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event discounts data, please try again' }, res);
    }
};
exports.getdiscount = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                    {path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel)},
                    {path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel)},
                    {path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel)},
                ]).lean();
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, discounts: eventData.discounts }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event discount details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};