let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const axios = require('axios');
const mongoose = require('mongoose');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
router.post('/', async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, email, mobile, country_code, password, refer_code, fcm_token, agentid } = req.body;
    if (name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && mobile && mobile.length == 10 && country_code && country_code.trim() != '' && password) {
        if ((/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,100}$/.test(password))) {
            let ecnPassword = await helper.passwordEncryptor(password);
            let my_referCode = await helper.makeid(6);
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let checkExisting = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ $or: [{ mobile: mobile }, { email: email }] }).lean();
            if (checkExisting == null) {
                let obj = {
                    name: name,
                    email: email,
                    mobile: mobile,
                    country_code: country_code,
                    password: ecnPassword,
                    profile_pic: "",
                    refer_code: refer_code,
                    my_refer_code: my_referCode,
                    f_coin: 0,
                    fcm_token: fcm_token,
                    is_approved: false,
                    status: true,
                    mobileverified: false,
                    businessProfile: {},
                    agentid: (agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)) ? mongoose.Types.ObjectId(agentid) : null
                };
                const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
                let otpSend = await axios.get(url, config);
                if (otpSend.data.Details) {
                    obj.otpVerifyKey = otpSend.data.Details;
                    await primary.model(constants.MODELS.organizers, organizerModel).create(obj);
                    return responseManager.onSuccess('Organizer register successfully!', { key: otpSend.data.Details }, res);
                } else {
                    return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Organizer already exist with same mobile or email, Please try again...' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Make sure your password is of 8 characters, 5 alphabets, 2 number and 1 symbol, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to register organizer, please try again' }, res);
    }
});
router.post('/verifyotp', async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { key, otp, mobile } = req.body;
    if (key && key.trim() != '' && otp && otp.trim() != '' && otp.length == 6 && mobile && mobile.length == 10) {
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ mobile: mobile, otpVerifyKey: key }).lean();
        if (organizerData) {
            const url = process.env.FACTOR_URL + "VERIFY3/" + mobile + "/" + otp;
            let verifiedOTP = await axios.get(url, config);
            if (verifiedOTP.data.Status != 'Error') {
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, { mobileverified: true });
                return responseManager.onSuccess('Organizer mobile number verified successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid OTP, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid data to verify organizer mobile number, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid otp or mobile number to verify organizer mobile number, please try again' }, res);
    }
});
router.post('/forgotpassword', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile } = req.body;
    if (mobile && mobile != '' && mobile.length == 10) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ mobile: mobile }).lean();
        if (checkExisting) {
            const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
            let otpSend = await axios.get(url, config);
            if (otpSend.data.Details) {
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: otpSend.data.Details });
                return responseManager.onSuccess('Organizer mobile identified and otp sent successfully!', { key: otpSend.data.Details }, res);
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer mobile number, Please try again...' }, res);
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
            let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ mobile: mobile }).lean();
            if (organizerData) {
                let ecnPassword = await helper.passwordEncryptor(password);
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, { password: ecnPassword });
                return responseManager.onSuccess('Organizer password changed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid organizer mobile number, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Make sure your password is of 8 characters, 5 alphabets, 2 number and 1 symbol, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to change organizer password, please try again' }, res);
    }
});
router.post('/resendotp', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile } = req.body;
    if (mobile && mobile != '' && mobile.length == 10) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ mobile: mobile }).lean();
        if (checkExisting) {
            const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
            let otpSend = await axios.get(url, config);
            if (otpSend.data.Details) {
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: otpSend.data.Details });
                return responseManager.onSuccess('Organizer mobile identified and otp sent successfully!', { key: otpSend.data.Details }, res);
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizer mobile number, Please try again...' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid mobile number, please try again' }, res);
    }
});
module.exports = router;
