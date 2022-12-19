const eventModel = require('../../../models/events.model');
const serviceModel = require('../../../models/service.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
let async = require('async');
exports.addservice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid, serviceid, name, price, price_type, quantity } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (serviceid && serviceid != '' && mongoose.Types.ObjectId.isValid(serviceid) && eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                if (name && name.trim() != '' && price && price.trim() != '' && price_type && price_type.trim() != '' && quantity && quantity.trim() != '') {
                    let obj = {
                        eventid: eventid,
                        name: name,
                        price: price,
                        price_type: price_type,
                        quantity: quantity,
                        isAdded: false,
                        photos: (req.body.photos) ? req.body.photos : [],
                        description: (req.body.description) ? req.body.description : '',
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    await primary.model(constants.MODELS.services, serviceModel).findByIdAndUpdate(serviceid, obj);
                    let serviceData = await primary.model(constants.MODELS.services, serviceModel).findById(serviceid);
                    return responseManager.onSuccess('Organizer event service data updated successfully!', serviceData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid add service name, price, price type and quantity can not be empty, please try again' }, res);
                }
            } else {
                if (name && name.trim() != '' && price && price.trim() != '' && price_type && price_type.trim() != '' && quantity && quantity.trim() != '') {
                    let obj = {
                        eventid: eventid,
                        name: name,
                        price: price,
                        price_type: price_type,
                        quantity: quantity,
                        photos: (req.body.photos) ? req.body.photos : [],
                        description: (req.body.description) ? req.body.description : '',
                        isAdded: false,
                        createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    let serviceData = await primary.model(constants.MODELS.services, serviceModel).create(obj);
                    return responseManager.onSuccess('Organizer event service data created successfully!', serviceData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid add service name, price, price type and quantity can not be empty, please try again' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create event service data, please try again' }, res);
    }
};
exports.listservice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                primary.model(constants.MODELS.services, serviceModel).find({ eventid: eventid } ).lean().then((services) => {
                    return responseManager.onSuccess('Services list!', services, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                })
            }
            else {
                return responseManager.badrequest({ message: 'Invalid event id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }

    } else {
        return responseManager.badrequest({ message: 'Invalid token to remove category data, please try again' }, res);
    }
};
exports.getoneservice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { serviceid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (serviceid && serviceid != '' && mongoose.Types.ObjectId.isValid(serviceid)) {
                let serviceData = await primary.model(constants.MODELS.services, serviceModel).findById(serviceid);
                if (serviceData && serviceData != null) {
                    return responseManager.onSuccess('Services data !', serviceData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid service id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid service id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get service list, please try again' }, res);
    }
};
exports.removeservice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { serviceid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (serviceid && serviceid != '' && mongoose.Types.ObjectId.isValid(serviceid)) {
                await primary.model(constants.MODELS.services, serviceModel).findByIdAndRemove(serviceid.toString().trim());
                return responseManager.onSuccess('Service removed sucecssfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid service id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get service data, please try again' }, res);
    }
};


exports.selectservice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid, services } = req.body;
            let finalServices = [];
            async.forEachSeries(services, (service, next_service) => {
                if (service && service.length > 0) {
                    finalServices.push(service);
                } else {
                    finalServices.push(services);
                }
                next_service();
            }, () => {
                (async () => {
                    if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), services: finalServices });
                        let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                            path: "services",
                            model: primary.model(constants.MODELS.services, serviceModel),
                            select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                        }).lean();
                        if (eventData && eventData != null) {
                            return responseManager.onSuccess('Organizer event services data updated successfully!', { _id: eventData._id, services: eventData.services }, res);
                        } else {
                            return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid event id to add event services data, please try again' }, res);
                    }
                })().catch((error) => {
                    return responseManager.onError(error, res);
                });
            });

        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event services data, please try again' }, res);
    }
};
exports.getselectservice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid } = req.query;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                    path: "services",
                    model: primary.model(constants.MODELS.services, serviceModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean();
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, services: eventData.services }, res);
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
