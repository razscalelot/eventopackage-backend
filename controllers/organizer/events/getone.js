const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const serviceModel = require('../../../models/service.model');
const equipmentModel = require('../../../models/equipments.model');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { eventid } = req.query;
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                    {path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type"},
                    {path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'}
                ]).lean();
                if(eventData && eventData != null && (eventData.createdBy.toString() == req.token.organizerid.toString())){
                    return responseManager.onSuccess('Organizer event data!', eventData, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};