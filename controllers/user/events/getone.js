const eventModel = require('../../../models/events.model');
const userModel = require('../../../models/users.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const serviceModel = require('../../../models/service.model');
const equipmentModel = require('../../../models/equipments.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const wishlistModel = require('../../../models/eventwishlists.model');
const itemModel = require('../../../models/items.model');
const async = require('async');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if (userData && userData.status == true && userData.mobileverified == true) {
            const { eventid } = req.query;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                    { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type" },
                    { path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' }
                ]).lean();
                if (eventData && eventData != null) {
                    let noofreview = parseInt(await primary.model(constants.MODELS.eventreviews, eventreviewModel).countDocuments({ eventid: mongoose.Types.ObjectId(eventData._id) }));
                    let allServices = [];
                    let allItems = [];
                    let allEquipments = [];
                    let totalPrice = 0;
                    async.forEach(eventData.discounts, (discount, next_discount) => {
                        if (discount.discounttype === "discount_on_total_bill") {
                            if (eventData.aboutplace) {
                                let getPrice = parseFloat(eventData.aboutplace.place_price) - (parseFloat(eventData.aboutplace.place_price) * parseFloat(discount.discount) / 100);
                                totalPrice += parseFloat(getPrice).toFixed(2);
                            } else if (eventData.personaldetail) {
                                let getPrice = parseFloat(eventData.personaldetail.price) - (parseFloat(eventData.personaldetail.price) * parseFloat(discount.discount) / 100);
                                totalPrice += parseFloat(getPrice).toFixed(2);
                            }
                        }
                        next_discount();
                    }, () => {
                        if (eventData.aboutplace) {
                            eventData.aboutplace.place_price = parseFloat(eventData.aboutplace.place_price).toFixed(2);
                        } else if (eventData.personaldetail) {
                            eventData.personaldetail.price = parseFloat(eventData.personaldetail.price).toFixed(2);
                        }
                        if (totalPrice == 0) {
                            if (eventData.aboutplace) {
                                totalPrice = parseFloat(eventData.aboutplace.place_price);
                            } else if (eventData.personaldetail) {
                                totalPrice = parseFloat(eventData.personaldetail.price);
                            }
                        }
                        eventData.totalPrice = parseFloat(totalPrice).toFixed(2);
                    });
                    async.forEachSeries(eventData.services, (service, next_service) => {
                        async.forEachSeries(eventData.discounts, (discount, next_discount) => {
                            discount.services.forEach((element) => {
                                if (element._id.toString() == service._id.toString()) {
                                    let totalPrice = parseFloat(service.price) - (parseFloat(service.price) * parseFloat(discount.discount) / 100);
                                    service.totalPrice = parseFloat(totalPrice).toFixed(2)
                                    service.discount = discount.discount;
                                }
                            });
                            next_discount();
                        });
                        service.price = parseFloat(service.price).toFixed(2);
                        allServices.push(service);
                        next_service();
                    }, () => {
                        async.forEachSeries(eventData.items, (item, next_item) => {
                            async.forEachSeries(eventData.discounts, (discount, next_discount) => {
                                discount.items.forEach((element) => {
                                    if (element._id.toString() == item._id.toString()) {
                                        let totalPrice = parseFloat(item.price) - (parseFloat(item.price) * parseFloat(discount.discount) / 100);
                                        item.totalPrice = parseFloat(totalPrice).toFixed(2)
                                        item.discount = discount.discount;
                                    }
                                });
                                next_discount();
                            });
                            item.price = parseFloat(item.price).toFixed(2);
                            allItems.push(item);
                            next_item();
                        }, () => {
                            async.forEachSeries(eventData.equipments, (equipment, next_equipment) => {
                                async.forEachSeries(eventData.discounts, (discount, next_discount) => {
                                    discount.equipments.forEach((element) => {
                                        if (element._id.toString() == equipment._id.toString()) {
                                            let totalPrice = parseFloat(equipment.price) - (parseFloat(equipment.price) * parseFloat(discount.discount) / 100);
                                            equipment.totalPrice = parseFloat(totalPrice).toFixed(2)
                                            equipment.discount = discount.discount;
                                        }
                                    });
                                    next_discount();
                                });
                                equipment.price = parseFloat(equipment.price).toFixed(2);
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
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};