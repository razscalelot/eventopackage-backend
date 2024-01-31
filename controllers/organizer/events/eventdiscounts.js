const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const dicountModel = require('../../../models/discounts.model');
const serviceModel = require('../../../models/service.model');
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.withpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
};
exports.withoutpagination = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            primary.model(constants.MODELS.discounts, dicountModel).find({ status: true }).populate({
                path: "services",
                model: primary.model(constants.MODELS.services, serviceModel),
                select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
            }).lean().then((dicsounts) => {
                return responseManager.onSuccess('Discount list!', dicsounts, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get discount list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};
exports.getone = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { discountid } = req.body;
        if (discountid && discountid != '' && mongoose.Types.ObjectId.isValid(discountid)) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
            if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
                primary.model(constants.MODELS.discounts, dicountModel).findById(discountid).populate({
                    path: "services",
                    model: primary.model(constants.MODELS.services, serviceModel),
                    select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'
                }).lean().then((dicsount) => {
                    return responseManager.onSuccess('Discount data!', dicsount, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid organizerid to get discount list, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};