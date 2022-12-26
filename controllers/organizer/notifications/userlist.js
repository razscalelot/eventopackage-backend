const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const customerimportModel = require("../../../models/customerimports.model");
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.userlist = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { notificationid, page, limit, search } = req.body;
            if(notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)){
                primary.model(constants.MODELS.customerimports, customerimportModel).paginate({
                    $or: [
                        { FullName: { '$regex': new RegExp(search, "i") } },
                        { MobileNumber: { '$regex': new RegExp(search, "i") } },
                        { EmailId: { '$regex': new RegExp(search, "i") } }
                    ],
                    notificationid : mongoose.Types.ObjectId(notificationid),
                    createdBy: mongoose.Types.ObjectId(req.token.organizerid)
                }, {
                    page,
                    limit: parseInt(limit),
                    sort: { _id: -1 },
                    lean: true,
                    select : "-createdBy -__v -updatedAt -createdAt"
                }).then((users) => {
                    return responseManager.onSuccess('Users list!', users, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Invalid notification id to get users list, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get users list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};