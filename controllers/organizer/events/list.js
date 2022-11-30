const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const serviceModel = require('../../../models/service.model');
const equipmentModel = require('../../../models/equipments.model');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { page, limit, search } = req.body;
            await primary.model(constants.MODELS.events, eventModel).paginate({
                $or: [
                    { display_name : { '$regex' : new RegExp(search, "i") } },
                    { event_type : { '$regex' : new RegExp(search, "i") } },
                ],
                createdBy : mongoose.Types.ObjectId(req.token.organizerid)
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                populate:  { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type" },
                select: 'display_name event_type event_category timestamp status createdAt updatedAt capacity banner',
                lean: true
            }).then((events) => {
                return responseManager.onSuccess('Events list!', events, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event list, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get event list, please try again' }, res);
    }
};