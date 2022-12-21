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
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                    {path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type"},
                    {path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'}
                ]).lean();
                if(eventData && eventData != null){
                    let allServices = [];
                    let allItems = [];
                    let allEquipments = [];
                    async.forEachSeries(eventData.services, (service, next_service) => {
                        async.forEachSeries(eventData.discounts, (discount, next_discount) => {
                            discount.services.forEach((element) => {
                                if(element._id.toString() == service._id.toString()){ 
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
                                    if(element._id.toString() == item._id.toString()){
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
                                        if(element._id.toString() == equipment._id.toString()){
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
                                ( async () => {
                                    // console.log("allServices", allServices);
                                    // console.log("allItems", allItems);
                                    // console.log("allEquipments", allEquipments);
                                    let wishlist = await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOne({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                                    let allreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).find({eventid : mongoose.Types.ObjectId(eventid)}).populate({path : 'userid', model : primary.model(constants.MODELS.users, userModel), select : "name profile_pic"}).lean();
                                    let currentuserreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({userid : mongoose.Types.ObjectId(req.token.userid), eventid: mongoose.Types.ObjectId(eventid)}).lean();
                                    eventData.whishlist_status = (wishlist == null) ? false : true
                                    eventData.isUserReview  = (currentuserreview == null) ? false : true
                                    // eventData.reviews = (allreview.length === 0) ? false : allreview;
                                    eventData.reviews = allreview;
                                    return responseManager.onSuccess('User event data!', eventData, res);
                                })().catch((error) => {});
                               
                            });
                        });
                    });
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};