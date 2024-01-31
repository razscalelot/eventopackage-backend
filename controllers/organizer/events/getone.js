const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const userModel = require('../../../models/users.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const serviceModel = require('../../../models/service.model');
const itemModel = require('../../../models/items.model');
const equipmentModel = require('../../../models/equipments.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const async = require('async');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
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
                if (eventData && eventData != null && (eventData.createdBy.toString() == req.token.organizerid.toString())) {
                    let totalPrice = 0;
                    async.forEach(eventData.discounts, (discount, next_discount) => {
                        if (discount.discounttype === "discount_on_total_bill") {
                            if (eventData.aboutplace) {
                                let getPrice = parseInt(eventData.aboutplace.place_price) - (parseInt(eventData.aboutplace.place_price) * parseInt(discount.discount) / 100);
                                totalPrice += getPrice;
                            } else if (eventData.personaldetail) {
                                let getPrice = parseInt(eventData.personaldetail.price) - (parseInt(eventData.personaldetail.price) * parseInt(discount.discount) / 100);
                                totalPrice += getPrice;
                            }
                        }
                        next_discount();
                    }, () => {
                        isApprovedServices = []
                        async.forEachSeries(eventData.services, (service, next_service) => {
                            if (service.is_approved == true) {
                                isApprovedServices.push(service)
                            }
                            next_service();
                            eventData.services = isApprovedServices
                        }, () => {
                            isApprovedItems = []
                            async.forEachSeries(eventData.items, (item, next_item) => {
                                if (item.is_approved == true) {
                                    isApprovedItems.push(item)
                                }
                                next_item();
                                eventData.items = isApprovedItems
                            }, () => {
                                isApprovedEquipments = []
                                async.forEachSeries(eventData.equipments, (equipment, next_equipment) => {
                                    if (equipment.is_approved == true) {
                                        isApprovedEquipments.push(equipment)
                                    }
                                    next_equipment();
                                    eventData.equipments = isApprovedEquipments
                                }, () => {
                                    (async () => {
                                        if (totalPrice == 0) {
                                            if (eventData.aboutplace) {
                                                totalPrice = parseFloat(eventData.aboutplace.place_price);
                                            } else if (eventData.personaldetail) {
                                                totalPrice = parseFloat(eventData.personaldetail.price);
                                            }
                                        }
                                        eventData.totalPrice = parseFloat(totalPrice).toFixed(2);
                                    })().catch((error) => { });
                                });
                            });
                        });
                    });
                    let allreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).find({ eventid: mongoose.Types.ObjectId(eventid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name profile_pic" }).lean();
                    let allattendee = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ eventId: mongoose.Types.ObjectId(eventid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name profile_pic" }).lean();
                    eventData.reviews = allreview;
                    eventData.attendee = allattendee;
                    return responseManager.onSuccess('Organizer event data!', eventData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};