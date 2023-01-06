let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const organizerModel = require('../../models/organizers.model');
const axios = require('axios');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};

router.post('/', async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { phone_no, password, fcm_token } = req.body;
    if (phone_no && password && phone_no.length == 10 && password.length >= 6) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findOne({ phone_no: phone_no, status: true }).lean();
        if (userData && userData != null && userData.mobileverified == true) {
            let decPassword = await helper.passwordDecryptor(userData.password);
            if (decPassword == password) {
                if((userData.lastloginAt == undefined || userData.lastloginAt == null || userData.lastloginAt == 0) && (userData.first_login_at == undefined)){
                    if(userData.refer_code && userData.refer_code != '' && userData.refer_code != null && userData.refer_code != 0){
                        let referbyuser = await  primary.model(constants.MODELS.users, userModel).findOne({my_refer_code : userData.refer_code}).lean();
                        if(referbyuser) {
                            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(referbyuser._id, {f_coin : (referbyuser.f_coin) ? parseFloat(referbyuser.f_coin + 10) : parseFloat(10)});
                            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, {f_coin : parseFloat(10), first_login_at : Date.now()});
                        }else{
                            let referbyOrganiser = await primary.model(constants.MODELS.organizers, organizerModel).findOne({my_refer_code : userData.refer_code}).lean();
                            if(referbyOrganiser){
                                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(referbyOrganiser._id, {f_coin : (referbyOrganiser.f_coin) ? parseFloat(referbyOrganiser.f_coin + 10) : parseFloat(10)});
                                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, {f_coin : parseFloat(10), first_login_at : Date.now()});
                            }
                        }
                    }
                }
                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, {fcm_token : (fcm_token) ? fcm_token : '', lastloginAt : Date.now()});
                let accessToken = await helper.generateAccessToken({ userid: userData._id.toString() });
                return responseManager.onSuccess('User login successfully!', { token: accessToken }, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid password, please try again' }, res);
            }
        }else if (userData && userData != null && userData.mobileverified == false) {
            const url = process.env.FACTOR_URL + userData.phone_no + "/AUTOGEN";
            let otpSend = await axios.get(url, config);
            if (otpSend.data.Details) {
                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, { otpVerifyKey: otpSend.data.Details, mobileverified: true });
                return responseManager.onSuccess('OTP send!', { key: otpSend.data.Details }, res);
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        }
        else {
            return responseManager.badrequest({ message: 'Invalid mobile or password please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid mobile or password please try again' }, res);
    }
});
module.exports = router;
