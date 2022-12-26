const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { page, limit, search } = req.body;
            primary.model(constants.MODELS.notifications, notificationModel).paginate({
                $or: [
                    { notification_title: { '$regex': new RegExp(search, "i") } },
                    { description: { '$regex': new RegExp(search, "i") } }
                ],
                createdBy: mongoose.Types.ObjectId(req.token.organizerid)
            }, {
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                lean: true
            }).then((notifications) => {
                return responseManager.onSuccess('Notifications list!', notifications, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get notification list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};