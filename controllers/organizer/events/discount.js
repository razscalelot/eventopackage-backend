const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const serviceModel = require('../../../models/service.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
let async = require('async');
exports.discount = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid, discounts } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                if (discounts && discounts.length > 0) {
                    let finalDiscount = [];
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
                            console.log('finalDiscount', finalDiscount);
                            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), discounts: finalDiscount });
                                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                                    path: "discounts.services",
                                    model: primary.model(constants.MODELS.services, serviceModel),
                                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                                }).lean();
                                return responseManager.onSuccess('Organizer event discounts data updated successfully!', { _id: eventData._id, discounts: eventData.discounts }, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid event id to add event discounts data, please try again' }, res);
                            }
                        })().catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    });
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
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                    path: "discounts.services",
                    model: primary.model(constants.MODELS.services, serviceModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean();
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