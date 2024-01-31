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
exports.verifyotpforagent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { key, otp, mobile } = req.body;
    if (key && key.trim() != '' && otp && otp.trim() != '' && otp.length == 6 && mobile && mobile.length == 10) {
        let agentData = await primary.model(constants.MODELS.agents, agentModel).findOne({ mobile: mobile, otpVerifyKey: key }).lean();
        if (agentData) {
            const url = process.env.FACTOR_URL + "VERIFY3/" + mobile + "/" + otp;
            let verifiedOTP = await axios.get(url, config);
            if (verifiedOTP.data.Status == 'Success') {
                await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(agentData._id, { mobileverified: true });
                return responseManager.onSuccess('Agent mobile number verified successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid OTP, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid data to verify agent mobile number, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid otp or mobile number to verify agent mobile number, please try again' }, res);
    }
};