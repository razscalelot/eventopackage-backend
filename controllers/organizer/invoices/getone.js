const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const userModel = require('../../../models/users.model');
const mongoose = require('mongoose');
exports.getoneinvoice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { invoiceid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (invoiceid && invoiceid != '' && mongoose.Types.ObjectId.isValid(invoiceid)) {
                let invoiceData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).findById(invoiceid).populate({
                    path: "userid",
                    model: primary.model(constants.MODELS.users, userModel),
                    select: 'name profile_pic'
                }).lean();
                if (invoiceData && invoiceData != null) {
                    return responseManager.onSuccess('Invoice data!', invoiceData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid invoice id get invoice data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid invoice id get invoice data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get invoice, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get invoice data, please try again' }, res);
    }
};