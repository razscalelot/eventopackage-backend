const helper = require('../../../utilities/helper');
const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const userModel = require('../../../models/users.model');
const async = require("async");
const mongoose = require('mongoose');
exports.getoneinvoice = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
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