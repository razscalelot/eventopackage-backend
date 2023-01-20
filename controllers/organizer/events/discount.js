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
                    { path: "services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    { path: "equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                ]).lean();
                if (eventData && eventData != null) {
                    let allServices = [];
                    async.forEachSeries(eventData.services, (service, next_service) => {
                        service.type = 'service';
                        allServices.push(service);
                        next_service();
                    }, () => {
                        async.forEachSeries(eventData.items, (item, next_item) => {
                            item.type = 'item';
                            allServices.push(item);
                            next_item();
                        }, () => {
                            async.forEachSeries(eventData.equipments, (equipment, next_equipment) => {
                                equipment.type = 'equipment';
                                allServices.push(equipment);
                                next_equipment();
                            }, () => {
                                (async () => {
                                    return responseManager.onSuccess('User event data!', allServices, res);
                                })().catch((error) => { });
                            });
                        });
                    });
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
                let maineventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (maineventData && maineventData.iseditable == true) {
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
                                        { path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel) },
                                        { path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel) },
                                        { path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel) },
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
                    } else {
                        finalDiscount.push(discounts);
                        if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                            await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), discounts: finalDiscount });
                            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                                { path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel) },
                                { path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel) },
                                { path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel) },
                                // select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                            ]).lean();
                            return responseManager.onSuccess('Organizer event discounts data updated successfully!', { _id: eventData._id, discounts: eventData.discounts }, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid event id to add event discounts data, please try again' }, res);
                        }
                    }
                } else {
                    return responseManager.badrequest({ message: 'Event data can not be updated as event booking started..., Please contact admin to update event data' }, res);
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
                    // { path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    // { path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                    // { path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
                ]).lean();
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, discounts: eventData.discounts }, res);;
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