const eventModel = require('../../../models/events.model');
const userModel = require('../../../models/users.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if (userData && userData.status == true && userData.mobileverified == true) {
            const { page, limit, search } = req.body;
            await primary.model(constants.MODELS.events, eventModel).paginate({
                $or: [
                    { display_name : { '$regex' : new RegExp(search, "i") } },
                    { event_type : { '$regex' : new RegExp(search, "i") } },
                    { category_name : { '$regex' : new RegExp(search, "i") } },
                    { name : { '$regex' : new RegExp(search, "i") } },
                ],
                // createdBy : mongoose.Types.ObjectId(req.token.organizerid)
            },{
                page,       
                limit: parseInt(limit),
                sort: { _id : -1 },
                populate:  { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type" },
                select: 'display_name event_type event_category timestamp status createdAt updatedAt capacity aboutplace',
                lean: true
            }).then((events) => {
                return responseManager.onSuccess('Events list!', events, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid userid to get event list, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event list, please try again' }, res);
    }
};