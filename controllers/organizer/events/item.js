const eventModel = require('../../../models/events.model');
const itemModel = require('../../../models/items.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
let async = require('async');
exports.additem = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { itemid, eventType, name, price, price_type, quantity } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)) {
                if (name && name.trim() != '' && price && price.trim() != '' && price_type && price_type.trim() != '' && quantity && quantity.trim() != '') {
                    let obj = {
                        name: name,
                        price: price,
                        price_type: price_type,
                        quantity: quantity,
                        photos: (req.body.photos) ? req.body.photos : [],
                        description: (req.body.description) ? req.body.description : '',
                        isAdded: false,
                        itemCount: 1,
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    await primary.model(constants.MODELS.items, itemModel).findByIdAndUpdate(itemid, obj);
                    let itemData = await primary.model(constants.MODELS.items, itemModel).findById(itemid);
                    return responseManager.onSuccess('Organizer event item data updated successfully!', itemData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid add item name, price, price type and quantity can not be empty, please try again' }, res);
                }
            } else {
                if (name && name.trim() != '' && price && price.trim() != '' && price_type && price_type.trim() != '' && quantity && quantity.trim() != '' && eventType && eventType.trim() != '') {
                    let obj = {
                        eventType: eventType,
                        name: name,
                        price: price,
                        price_type: price_type,
                        quantity: quantity,
                        photos: (req.body.photos) ? req.body.photos : [],
                        description: (req.body.description) ? req.body.description : '',
                        isAdded: false,
                        itemCount: 1,
                        createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    let itemData = await primary.model(constants.MODELS.items, itemModel).create(obj);
                    return responseManager.onSuccess('Organizer event item data created successfully!', itemData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid add item name, price, price type and quantity can not be empty, please try again' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create event item data, please try again' }, res);
    }
};
exports.listitem = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            const { eventType } = req.query;
            // if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            primary.model(constants.MODELS.items, itemModel).find({ eventType: eventType, createdBy: mongoose.Types.ObjectId(req.token.organizerid) }).sort({ _id: -1 }).lean().then((items) => {
                return responseManager.onSuccess('Items list!', items, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
            // }
            // else {
            //     return responseManager.badrequest({ message: 'Invalid event id to get item data, please try again' }, res);
            // }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update item data, please try again' }, res);
        }

    } else {
        return responseManager.badrequest({ message: 'Invalid token to get item data, please try again' }, res);
    }
};
exports.getoneitem = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { itemid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)) {
                let itemData = await primary.model(constants.MODELS.items, itemModel).findById(itemid);
                if (itemData && itemData != null) {
                    return responseManager.onSuccess('Items data !', itemData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid item id get item data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid item id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update item data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get item list, please try again' }, res);
    }
};
exports.removeitem = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { itemid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)) {
                await primary.model(constants.MODELS.items, itemModel).findByIdAndRemove(itemid.toString().trim());
                return responseManager.onSuccess('Item removed sucecssfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid item id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get item data, please try again' }, res);
    }
};
exports.selectitem = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid, items } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let maineventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (maineventData && maineventData.iseditable == true) {
                    let finalItems = [];
                    async.forEachSeries(items, (item, next_item) => {
                        if (item && item.length > 0) {
                            finalItems.push(item);
                        } else {
                            finalItems.push(items);
                        }
                        next_item();
                    }, () => {
                        (async () => {
                            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), items: finalItems });
                                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                                    path: "items",
                                    model: primary.model(constants.MODELS.items, itemModel),
                                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                                }).lean();
                                if (eventData && eventData != null) {
                                    return responseManager.onSuccess('Organizer event items data updated successfully!', { _id: eventData._id, items: eventData.items }, res);
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid event id get item data, please try again' }, res);
                                }
                            } else {
                                return responseManager.badrequest({ message: 'Invalid event id to add event items data, please try again' }, res);
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
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event item data, please try again' }, res);
    }
};
exports.getselectitem = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate({
                    path: "items",
                    model: primary.model(constants.MODELS.items, itemModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean();
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, items: eventData.items }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get item data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event item details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get item data, please try again' }, res);
    }
};
