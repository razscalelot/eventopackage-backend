const serviceModel = require('../../../models/service.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.addservice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { serviceid, name, price, price_type, quantity } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (serviceid && serviceid != '' && mongoose.Types.ObjectId.isValid(serviceid)) {
            if (name && name.trim() != '' && price && price.trim() != '' && price_type && price_type.trim() != '' && quantity && quantity.trim() != '') {
                let obj = {
                    name: name,
                    price: price,
                    price_type: price_type,
                    quantity: quantity,
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
                    name: name,
                    price: price,
                    price_type: price_type,
                    quantity: quantity,
                    description: (req.body.description) ? req.body.description : '',
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
        return responseManager.badrequest({ message: 'Invalid token to create event service data, please try again' }, res);
    }
};