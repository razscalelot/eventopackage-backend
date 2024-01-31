const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.deleteorganizerdata = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();

        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, { status: false });
            return responseManager.onSuccess('Organizer deleted successfully!', 1, res);
        } else {
            return responseManager.onSuccess('Invalid Organizer id to delete organizer, Please try again!', 0, res);
        }
    } else {
        return responseManager.onSuccess('Invalid Organizer id to delete organizer, Please try again!', 0, res);
    }
};