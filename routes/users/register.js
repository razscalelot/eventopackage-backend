let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const axios = require('axios');
const config = {
    headers : {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
router.post('/', async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, email, phone_no, country_code, password, refer_code } = req.body;
    if(name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && phone_no && phone_no.length == 10 && country_code && country_code.trim() != '' && password && password.length >= 6){
        let ecnPassword = await helper.passwordEncryptor(password);
        let my_referCode = await helper.makeid(6);
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.users, userModel).findOne({  $or: [ {phone_no: phone_no}, {email: email} ] }).lean();
        if(checkExisting == null){
            let obj = {
                name : name,
                email : email,
                phone_no : phone_no,
                country_code : country_code,
                password : ecnPassword,
                refer_code : refer_code,
                my_refer_code : my_referCode,
                status : true,
                mobileverified : false,
            };
            const url = process.env.FACTOR_URL + phone_no + "/AUTOGEN";
            let otpSend = await axios.get(url,config);
            if(otpSend.data.Details){
                obj.otpVerifyKey = otpSend.data.Details;
                await primary.model(constants.MODELS.users, userModel).create(obj);
                return responseManager.onSuccess('User register successfully!', {key : otpSend.data.Details}, res);
            }else{
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        }else{
            return responseManager.badrequest({message : 'User already exist with same mobile or email, Please try again...'}, res);
        }
    }else{
        return responseManager.badrequest({message : 'Invalid data to register user, please try again'}, res);
    } 
});
router.post('/verifyotp', async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { key, otp, phone_no } = req.body;
    if(key && key.trim() != '' && otp && otp.trim() != '' && otp.length == 6 && phone_no && phone_no.length == 10){
        let userData = await primary.model(constants.MODELS.users, userModel).findOne({phone_no : phone_no, otpVerifyKey : key}).lean();
        if(userData){
            const url = process.env.FACTOR_URL + "VERIFY/" + key + "/" + otp;
            let verifiedOTP = await axios.get(url ,config);
            console.log("verifiedOTP", verifiedOTP)
            if(verifiedOTP.data.Status == 'Success'){
                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, {mobileverified : true}).then(() => {
                    return responseManager.onSuccess('User mobile number verified successfully!', 1, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({message : 'Invalid OTP, please try again'}, res);
            }
        }else{
            return responseManager.badrequest({message : 'Invalid data to verify user mobile number, please try again'}, res);
        } 
    }else{
        return responseManager.badrequest({message : 'Invalid otp or mobile number to verify user mobile number, please try again'}, res);
    } 
});
router.post('/forgotpassword', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { phone_no } = req.body;
    if(phone_no && phone_no != '' && phone_no.length == 10){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.users, userModel).findOne({phone_no: phone_no}).lean();
        if(checkExisting){
            const url = process.env.FACTOR_URL + phone_no + "/AUTOGEN";
            let otpSend = await axios.get(url,config);
            if(otpSend.data.Details){
                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(checkExisting._id, {otpVerifyKey : otpSend.data.Details}).then(() => {
                    return responseManager.onSuccess('User mobile identified and otp sent successfully!', {key : otpSend.data.Details}, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        }else{
            return responseManager.badrequest({message : 'Invalid user mobile number, Please try again...'}, res);
        }
    }else{
        return responseManager.badrequest({message : 'Invalid mobile number, please try again'}, res);
    }
});
router.post('/changepassword', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { password, phone_no } = req.body;
    if(password && password.trim() != '' && password.length >= 6 && phone_no && phone_no.length == 10){
        let userData = await primary.model(constants.MODELS.users, userModel).findOne({phone_no : phone_no}).lean();
        if(userData){
            let ecnPassword = await helper.passwordEncryptor(password);
            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, {password : ecnPassword});
                return responseManager.onSuccess('User password changed successfully!', 1, res);
        }else{
            return responseManager.badrequest({message : 'Invalid user mobile number, please try again'}, res);
        }
    }else{
        return responseManager.badrequest({message : 'Invalid data to change user password, please try again'}, res);
    }
});
module.exports = router;
