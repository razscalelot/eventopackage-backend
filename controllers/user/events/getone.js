const eventModel = require('../../../models/events.model');
const userModel = require('../../../models/users.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const serviceModel = require('../../../models/service.model');
const equipmentModel = require('../../../models/equipments.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const wishlistModel = require('../../../models/eventwishlists.model');
const reviewModel = require('../../../models/eventreviews.model');
const mongoose = require('mongoose');
exports.getone = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if (userData && userData.status == true && userData.mobileverified == true) {
            const { eventid } = req.query;
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
                    {path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type"},
                    {path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'},
                    {path: "equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status'}
                ]).lean();
                if(eventData && eventData != null){
                    let wishlist = await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOne({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                    let allreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).find({eventid : mongoose.Types.ObjectId(eventid)}).populate({path : 'userid', model : primary.model(constants.MODELS.users, userModel), select : "name profile_pic"}).lean();
                    eventData.whishlist_status = (wishlist == null) ? false : true
                    eventData.reviews = (allreview.length === 0) ? false : allreview;
                    return responseManager.onSuccess('User event data!', eventData, res);
                }else{
                    return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};