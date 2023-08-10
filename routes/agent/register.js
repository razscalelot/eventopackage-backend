let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const agentModel = require('../../models/agents.model');
const axios = require('axios');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
router.post('/', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, email, mobile, country_code, password, fcm_token, country_wise_contact } = req.body;
    if (name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && mobile && mobile.length == 10 && country_code && country_code.trim() != '' && password) {
        if (password.length >= 8) {
            let ecnPassword = await helper.passwordEncryptor(password);
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let checkExisting = await primary.model(constants.MODELS.agents, agentModel).findOne({ $or: [{ mobile: mobile }, { email: email }] }).lean();
            if (checkExisting == null) {
                let obj = {
                    name: name,
                    email: email,
                    mobile: mobile,
                    country_code: country_code,
                    country_wise_contact: (country_wise_contact) ? country_wise_contact : {},
                    password: ecnPassword,
                    fcm_token: (fcm_token && fcm_token != '') ? fcm_token : '',
                    is_approved: true,
                    status: true,
                    mobileverified: false
                };
                const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
                let otpSend = await axios.get(url, config);
                if (otpSend.data.Details) {
                    obj.otpVerifyKey = otpSend.data.Details;
                    let agentData = await primary.model(constants.MODELS.agents, agentModel).create(obj);
                    await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(agentData._id, {channelID : agentData.mobile.toString() + '_' + agentData._id.toString()});
                    return responseManager.onSuccess('Agent register successfully!', { key: otpSend.data.Details }, res);
                } else {
                    return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                }
            } else {
                if (checkExisting.mobileverified == false) {
                    let obj = {
                        name: (name) ? name.trim() : '',
                        email: (email) ? email.trim() : '',
                        mobile: (mobile) ? mobile.trim() : '',
                        country_code: (country_code) ? country_code.trim() : '',
                        country_wise_contact: (country_wise_contact) ? country_wise_contact : {},
                        password: ecnPassword,
                        fcm_token: (fcm_token && fcm_token != '') ? fcm_token.trim() : '',
                        is_approved: true,
                        status: true,
                        mobileverified: false
                    };
                    const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
                    let otpSend = await axios.get(url, config);
                    if (otpSend.data.Details) {
                        obj.otpVerifyKey = otpSend.data.Details;
                        await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(checkExisting._id, obj);
                        let finalagentData = await primary.model(constants.MODELS.agents, agentModel).findById(checkExisting._id).lean();
                        await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(finalagentData._id, { channelID: finalagentData.mobile.toString() + '_' + finalagentData._id.toString() });
                        return responseManager.onSuccess('Agent register successfully!', { key: otpSend.data.Details, agentid: finalagentData._id.toString() }, res);
                    } else {
                        return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Agent already exist with same mobile or email, Please try again...' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Make sure your password is of at least 8 characters long, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to register agent, please try again' }, res);
    }
});
router.post('/verifyotp', async (req, res) => {
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
});
router.post('/forgotpassword', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile } = req.body;
    if (mobile && mobile != '' && mobile.length == 10) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.agents, agentModel).findOne({ mobile: mobile }).lean();
        if (checkExisting) {
            const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
            let otpSend = await axios.get(url, config);
            if (otpSend.data.Details) {
                await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: otpSend.data.Details });
                return responseManager.onSuccess('Agent mobile identified and otp sent successfully!', { key: otpSend.data.Details }, res);
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid agent mobile number, Please try again...' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid mobile number, please try again' }, res);
    }
});
router.post('/changepassword', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { password, mobile } = req.body;
    if (password && password.trim() != '' && mobile && mobile.length == 10) {
        if ((/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,100}$/.test(password))) {
            let agentData = await primary.model(constants.MODELS.agents, agentModel).findOne({ mobile: mobile }).lean();
            if (agentData) {
                let ecnPassword = await helper.passwordEncryptor(password);
                await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(agentData._id, { password: ecnPassword });
                return responseManager.onSuccess('Agent password changed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid agent mobile number, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Make sure your password is of at least 8 characters long and must contain, 1 Upper case, 1 Lower case 1 Special character, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to change agent password, please try again' }, res);
    }
});
router.post('/resendotp', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile } = req.body;
    if (mobile && mobile != '' && mobile.length == 10) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.agents, agentModel).findOne({ mobile: mobile }).lean();
        if (checkExisting) {
            const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
            let otpSend = await axios.get(url, config);
            if (otpSend.data.Details) {
                await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: otpSend.data.Details });
                return responseManager.onSuccess('Agent mobile identified and otp sent successfully!', { key: otpSend.data.Details }, res);
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid agent mobile number, Please try again...' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid mobile number, please try again' }, res);
    }
});
module.exports = router;
