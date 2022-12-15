const eventModel = require('../../../models/events.model');
const userModel = require('../../../models/users.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const organizerModel = require('../../../models/organizers.model');
const wishlistModel = require('../../../models/eventwishlists.model');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { event_type, search } = req.body;
            primary.model(constants.MODELS.events, eventModel).find({
                status: true,
                $or: [
                    { name: { '$regex': new RegExp(search, "i") } },
                    { "createdBy.name": { '$regex': new RegExp(search, "i") } },
                    { "event_category.category_name": { '$regex': new RegExp(search, "i") } },
                    { "services.name": { '$regex': new RegExp(search, "i") } },
                    { "capacity.address": { '$regex': new RegExp(search, "i") } }
                ],
                $or: [
                    { event_type: { '$regex': new RegExp(event_type, "i") } },
                ],
            }).select("-services -photos -videos -othercost -companydetail -tandc -equipments -discounts -updatedBy -__v").populate([
                {path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name"},
                {path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel), select: "name profile_pic"}
            ]).lean().then((result) => {
                return responseManager.onSuccess("event List", result, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });

        } else {
            return responseManager.badrequest({ message: 'Invalid user request to find events near by you, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to find events near by you, please try again' }, res);
    }
};

