const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const agentModel = require('../../../models/agents.model');
const axios = require('axios');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
exports.resendotpforagent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile } = req.body;
    if (mobile && mobile != '' && mobile.length == 10) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.agents, agentModel).findOne({ mobile: mobile }).lean();
        if (checkExisting) {
            // const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
            // let otpSend = await axios.get(url, config);
            // if (otpSend.data.Details) {
                await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: '123456' });
                return responseManager.onSuccess('Agent mobile identified and otp sent successfully!', { key: '123456' }, res);
            // } else {
            //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            // }
        } else {
            return responseManager.badrequest({ message: 'Invalid agent mobile number, Please try again...' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid mobile number, please try again' }, res);
    }
};