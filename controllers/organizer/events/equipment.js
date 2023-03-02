const eventModel = require('../../../models/events.model');
const equipmentModel = require('../../../models/equipments.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
let async = require('async');
exports.addequipment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { equipmentid, eventType, name, price, price_type } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (equipmentid && equipmentid != '' && mongoose.Types.ObjectId.isValid(equipmentid)) {
                if (name && name.trim() != '' && price && price.trim() != '' && price_type && price_type.trim() != '') {
                    let obj = {
                        name: name,
                        price: price,
                        price_type: price_type,
                        quantity: (req.body.quantity) ? req.body.quantity : '',
                        description: (req.body.description) ? req.body.description : '',
                        photos: (req.body.photos) ? req.body.photos : [],
                        videos: (req.body.videos) ? req.body.videos : [],
                        isAdded: false,
                        is_approved: false,
                        itemCount: 1,
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid),
                    };
                    await primary.model(constants.MODELS.equipments, equipmentModel).findByIdAndUpdate(equipmentid, obj);
                    let equipmentData = await primary.model(constants.MODELS.equipments, equipmentModel).findById(equipmentid);
                    return responseManager.onSuccess('Organizer event equipment data updated successfully!', equipmentData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid add equipment name, price and price type can not be empty, please try again' }, res);
                }
            } else {
                if (name && name.trim() != '' && price && price.trim() != '' && price_type && price_type.trim() != '' && eventType && eventType.trim() != '') {
                    let obj = {
                        eventType: eventType,
                        name: name,
                        price: price,
                        price_type: price_type,
                        quantity: (req.body.quantity) ? req.body.quantity : '',
                        description: (req.body.description) ? req.body.description : '',
                        photos: (req.body.photos) ? req.body.photos : [],
                        videos: (req.body.videos) ? req.body.videos : [],
                        isAdded: false,
                        is_approved: false,
                        itemCount: 1,
                        createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    let equipmentData = await primary.model(constants.MODELS.equipments, equipmentModel).create(obj);
                    return responseManager.onSuccess('Organizer event equipment data created successfully!', equipmentData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid add equipment name, price, price type and quantity can not be empty, please try again' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create event equipment data, please try again' }, res);
    }
};
exports.listequipment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            const { eventType } = req.query;
            // if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            primary.model(constants.MODELS.equipments, equipmentModel).find({ eventType: eventType, createdBy: mongoose.Types.ObjectId(req.token.organizerid) }).sort({ _id: -1 }).lean().then((equipments) => {
                return responseManager.onSuccess('Equipments list!', equipments, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
            // }
            // else {
            //     return responseManager.badrequest({ message: 'Invalid event id to get item data, please try again' }, res);
            // }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }

    } else {
        return responseManager.badrequest({ message: 'Invalid token to remove category data, please try again' }, res);
    }
};
exports.getoneequipment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { equipmentid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (equipmentid && equipmentid != '' && mongoose.Types.ObjectId.isValid(equipmentid)) {
                let equipmentData = await primary.model(constants.MODELS.equipments, equipmentModel).findById(equipmentid);
                if (equipmentData && equipmentData != null) {
                    return responseManager.onSuccess('Equipments data !', equipmentData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid equipment id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid equipment id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get equipment list, please try again' }, res);
    }
};
exports.removeequipment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { equipmentid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (equipmentid && equipmentid != '' && mongoose.Types.ObjectId.isValid(equipmentid)) {
                await primary.model(constants.MODELS.equipments, equipmentModel).findByIdAndRemove(equipmentid);
                return responseManager.onSuccess('Equipments removed sucecssfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid equipment id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get equipment data, please try again' }, res);
    }
};


exports.selectequipment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid, equipments } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let maineventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (maineventData && maineventData.iseditable == true) {
                    let finalEquipments = [];
                    async.forEachSeries(equipments, (equipment, next_equipment) => {
                        if (equipment && equipment.length > 0) {
                            finalEquipments.push(equipment);
                        } else {
                            finalEquipments.push(equipments);
                        }
                        next_equipment()
                    }, () => {
                        (async () => {
                            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), equipments: finalEquipments });
                                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                                    path: "equipments",
                                    model: primary.model(constants.MODELS.equipments, equipmentModel),
                                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                                }).lean();
                                if (eventData && eventData != null) {
                                    return responseManager.onSuccess('Organizer event equipments data updated successfully!', { _id: eventData._id, equipments: eventData.equipments }, res);
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                                }
                            } else {
                                return responseManager.badrequest({ message: 'Invalid event id to add event equipments data, please try again' }, res);
                            }
                        })().catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    });
                } else {
                    return responseManager.badrequest({ message: 'Event data can not be updated as event booking started..., Please contact admin to update event data' }, res);
                }
            }
            else {
                return responseManager.badrequest({ message: 'Invalid event id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid token to update event equipments data, please try again' }, res);
        }
    }
};
exports.getselectequipment = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                    path: "equipments",
                    model: primary.model(constants.MODELS.equipments, equipmentModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean();
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, equipments: eventData.equipments }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event equipments details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};
