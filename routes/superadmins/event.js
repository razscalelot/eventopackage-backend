let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const categoryModel = require('../../models/categories.model');
const serviceModel = require('../../models/service.model');
const itemModel = require('../../models/items.model');
const equipmentModel = require('../../models/equipments.model');
const eventModel = require('../../models/events.model');
const userModel = require('../../models/users.model');
const eventreviewModel = require('../../models/eventreviews.model');
const eventbookingModel = require('../../models/eventbookings.model');
const organizerModel = require('../../models/organizers.model');
const async = require('async');
const { default: mongoose } = require("mongoose");
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid, event_category, page, limit, search, sortfield, sortoption, status } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            let query = {};
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                query.createdBy = mongoose.Types.ObjectId(organizerid);
            }
            if(event_category && event_category != '' && mongoose.Types.ObjectId.isValid(event_category)){
                query.event_category = mongoose.Types.ObjectId(event_category);
            }
            if(status && status != null && status != undefined){
                query.status = status;
            }
            primary.model(constants.MODELS.events, eventModel).paginate({
                $or: [
                    { name : { '$regex' : new RegExp(search, "i") } },
                    { event_type : { '$regex' : new RegExp(search, "i") } }
                ],
                ...query
            },{
                page,
                limit: parseInt(limit),
                sort: { [sortfield] : [sortoption] },
                populate: [
                    {path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type" },
                    {path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "createdBy", model: primary.model(constants.MODELS.organizers, organizerModel), select: 'name email mobile country_code profile_pic'}
                ],
                lean: true
            }).then((eventsList) => {
                return responseManager.onSuccess('events list!', eventsList, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get events list, please try again' }, res);
    }
});
router.post('/approve', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if(eventData){
                    if(eventData.is_approved == false){
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_approved : true});
                        let updatedData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                        return responseManager.onSuccess('Event approved sucecssfully!', updatedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Event is already approved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Event data not found to approve event, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to approve event, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/disapprove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if(eventData){
                    if(eventData.is_approved == true){
                        await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {is_approved : false});
                        let updatedData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                        return responseManager.onSuccess('Event disapproved sucecssfully!', updatedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Event is already disapproved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Event data not found to disapprove, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to disapprove event, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                await primary.model(constants.MODELS.events, eventModel).findByIdAndRemove(eventid);
                return responseManager.onSuccess('Event removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to remove event data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
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
                        if (totalPrice == 0) {
                            if (eventData.aboutplace) {
                                totalPrice = parseFloat(eventData.aboutplace.place_price);
                            } else if (eventData.personaldetail) {
                                totalPrice = parseFloat(eventData.personaldetail.price);
                            }
                        }
                        eventData.totalPrice = parseFloat(totalPrice).toFixed(2);
                    });
                    let allreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).find({ eventid: mongoose.Types.ObjectId(eventid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name profile_pic" }).lean();
                    let allattendee = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ eventId: mongoose.Types.ObjectId(eventid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name profile_pic" }).lean();
                    eventData.reviews = allreview;
                    eventData.attendee = allattendee;
                    return responseManager.onSuccess('Organizer event data!', eventData, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
});
module.exports = router;