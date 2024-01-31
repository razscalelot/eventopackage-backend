const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const agentModel = require('../../../models/agents.model');
const mongoose = require('mongoose');
const axios = require('axios');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
exports.loginagent = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile, password } = req.body;
    if (mobile && password && mobile.length == 10 && password.length >= 6) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let agentData = await primary.model(constants.MODELS.agents, agentModel).findOne({ mobile: mobile }).lean();
        if (agentData && agentData != null && agentData.status == true && agentData.mobileverified == true && agentData.is_approved == true) {
            let decPassword = await helper.passwordDecryptor(agentData.password);
            if (decPassword == password) {
                let accessToken = await helper.generateAccessToken({ agentid: agentData._id.toString() });
                await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(agentData._id, { last_login_at: Date.now() });
                return responseManager.onSuccess('Agent login successfully!', { token: accessToken, agentid: agentData._id.toString() }, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid password, please try again' }, res);
            }
        } else if (agentData && agentData != null && agentData.mobileverified == false) {
            const url = process.env.FACTOR_URL + agentData.mobile + "/AUTOGEN";
            let otpSend = await axios.get(url, config);
            if (otpSend.data.Details) {
                let newkey = otpSend.data.Details;
                await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(agentData._id, { otpVerifyKey: newkey });
                return responseManager.onSuccess('Agent otp sent for mobile verification!', { key: newkey }, res);
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid mobile or password please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid mobile or password please try again' }, res);
    }
};