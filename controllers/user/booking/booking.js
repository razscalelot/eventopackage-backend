const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const mongoose = require('mongoose');
exports.booking = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            // const { bookingid, eventid, start_date, end_date, start_time, end_time } = req.body;
            let createdBooking = await primary.model(constants.MODELS.eventbookings, eventbookingModel).create(req.body);
        } else {
            return responseManager.badrequest({ message: 'Invalid user id to book event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to book event data, please try again' }, res);
    }
};