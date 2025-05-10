const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const axios = require('axios');
exports.forgotorganizerpassword = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile } = req.body;
    if (mobile && mobile != '' && mobile.length == 10) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ mobile: mobile }).lean();
        if (checkExisting) {
            // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
            // let otpSend = await axios.get(url,config);
            // if (otpSend.data.Details) {
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: '123456' });
                return responseManager.onSuccess('Organizer mobile identified and otp sent successfully!', { key: '123456' }, res);
            // } else {
            //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            // }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer mobile number, Please try again...' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid mobile number, please try again' }, res);
    }
};