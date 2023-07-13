let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const organizerModel = require('../../models/organizers.model');
const fcointransactionModel = require('../../models/fcointransactions.model');
const fcoinsModel = require('../../models/fcoins.model');
const axios = require('axios');
const mongoose = require('mongoose');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
router.post('/', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile, country_code, refer_code, fcm_token } = req.body;
    console.log('mobile', mobile);
    if (mobile && mobile.length == 10 && country_code && country_code.trim() != '') {
        let my_referCode = await helper.makeid(6);
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.users, userModel).findOne({ mobile: mobile }).lean();
        if (checkExisting == null) {
            let obj = {
                name: '',
                email: '',
                mobile: (mobile) ? mobile.trim() : '',
                country_code: (country_code) ? country_code.trim() : '',
                refer_code: (refer_code) ? refer_code.trim() : '',
                my_refer_code: (my_referCode) ? my_referCode.trim() : '',
                fcm_token: (fcm_token) ? fcm_token.trim() : '',
                status: true,
                f_coin: 0,
                about: '',
                profilepic: '',
                mobileverified: false
            };
            const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
            let otpSend = await axios.get(url, config);
            if (otpSend.data.Details) {
                obj.otpVerifyKey = otpSend.data.Details;
                let createdUser = await primary.model(constants.MODELS.users, userModel).create(obj);
                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(createdUser._id, {channelID : createdUser.mobile.toString() + '_' + createdUser._id.toString()});
                return responseManager.onSuccess('User register successfully!', { key: otpSend.data.Details }, res);
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        }else{
            if(checkExisting.mobileverified == false){
                const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
                let otpSend = await axios.get(url, config);
                if (otpSend.data.Details) {
                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(checkExisting._id, {otpVerifyKey : otpSend.data.Details, channelID : checkExisting.mobile.toString() + '_' + checkExisting._id.toString()});
                    return responseManager.onSuccess('User register successfully!', { key: otpSend.data.Details }, res);
                } else {
                    return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                }
            }else{
                return responseManager.badrequest({ message: 'User already exist with same mobile, Please Login...' }, res);
            }
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to register user, please try again' }, res);
    }
});
router.post('/verifyotp', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { key, otp, mobile, fcm_token } = req.body;
    if (key && key.trim() != '' && otp && otp.trim() != '' && otp.length == 6 && mobile && mobile.length == 10) {
        let userData = await primary.model(constants.MODELS.users, userModel).findOne({ mobile: mobile, otpVerifyKey: key }).lean();
        if (userData && userData.mobileverified == false) {
            const url = process.env.FACTOR_URL + "VERIFY3/" + mobile + "/" + otp;
            (async () => {
                let verifiedOTP = await axios.get(url, config);
                if (verifiedOTP.data.Status == 'Success') {
                    if ((userData.lastloginAt == undefined || userData.lastloginAt == null || userData.lastloginAt == 0) && (userData.first_login_at == undefined)) {
                        if (userData.refer_code && userData.refer_code != '' && userData.refer_code != null && userData.refer_code != 0) {
                            let referbyuser = await primary.model(constants.MODELS.users, userModel).findOne({ my_refer_code: userData.refer_code }).lean();
                            if (referbyuser) {
                                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(referbyuser._id, { f_coin: (referbyuser.f_coin) ? parseFloat(referbyuser.f_coin + 10) : parseFloat(10) });
                                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, { f_coin: parseFloat(10), first_login_at: Date.now() });
                                let objmain = {
                                    receiver_id: mongoose.Types.ObjectId(userData._id),
                                    sender_id: null,
                                    transaction_type: 'refer',
                                    transaction_icon: 'global/tricons/refer.png',
                                    f_coins: parseFloat(10),
                                    refer_data: {
                                        from_refer: mongoose.Types.ObjectId(referbyuser._id),
                                        to_refer: mongoose.Types.ObjectId(userData._id),
                                    },
                                    timestamp: Date.now()
                                };
                                let currentCoinsmain = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                                if (currentCoinsmain && currentCoinsmain.length > 0) {
                                    let newCoin = parseFloat(parseFloat(currentCoinsmain[0].fcoins) - parseFloat(10));
                                    await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoinsmain[0]._id, { fcoins: newCoin });
                                    await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objmain);
                                }
                                let objrefer = {
                                    receiver_id: mongoose.Types.ObjectId(referbyuser._id),
                                    sender_id: null,
                                    transaction_type: 'refer',
                                    transaction_icon: 'global/tricons/refer.png',
                                    f_coins: parseFloat(10),
                                    refer_data: {
                                        from_refer: mongoose.Types.ObjectId(referbyuser._id),
                                        to_refer: mongoose.Types.ObjectId(userData._id),
                                    },
                                    timestamp: Date.now()
                                };
                                let currentCoinsrefer = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                                if (currentCoinsrefer && currentCoinsrefer.length > 0) {
                                    let newCoin = parseFloat(parseFloat(currentCoinsrefer[0].fcoins) - parseFloat(10));
                                    await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoinsrefer[0]._id, { fcoins: newCoin });
                                    await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objrefer);
                                }
                            } else {
                                let referbyOrganiser = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ my_refer_code: userData.refer_code }).lean();
                                if (referbyOrganiser) {
                                    await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(referbyOrganiser._id, { f_coin: (referbyOrganiser.f_coin) ? parseFloat(referbyOrganiser.f_coin + 10) : parseFloat(10) });
                                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, { f_coin: parseFloat(10), first_login_at: Date.now() });
                                    let objmain = {
                                        receiver_id: mongoose.Types.ObjectId(userData._id),
                                        sender_id: null,
                                        transaction_type: 'refer',
                                        transaction_icon: 'global/tricons/refer.png',
                                        f_coins: parseFloat(10),
                                        refer_data: {
                                            from_refer: mongoose.Types.ObjectId(referbyOrganiser._id),
                                            to_refer: mongoose.Types.ObjectId(userData._id),
                                        },
                                        timestamp: Date.now()
                                    };
                                    let currentCoinsmain = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                                    if (currentCoinsmain && currentCoinsmain.length > 0) {
                                        let newCoin = parseFloat(parseFloat(currentCoinsmain[0].fcoins) - parseFloat(10));
                                        await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoinsmain[0]._id, { fcoins: newCoin });
                                        await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objmain);
                                    }
                                    let objrefer = {
                                        receiver_id: mongoose.Types.ObjectId(referbyOrganiser._id),
                                        sender_id: null,
                                        transaction_type: 'refer',
                                        transaction_icon: 'global/tricons/refer.png',
                                        f_coins: parseFloat(10),
                                        refer_data: {
                                            from_refer: mongoose.Types.ObjectId(referbyOrganiser._id),
                                            to_refer: mongoose.Types.ObjectId(userData._id),
                                        },
                                        timestamp: Date.now()
                                    };
                                    let currentCoinsrefer = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                                    if (currentCoinsrefer && currentCoinsrefer.length > 0) {
                                        let newCoin = parseFloat(parseFloat(currentCoinsrefer[0].fcoins) - parseFloat(10));
                                        await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoinsrefer[0]._id, { fcoins: newCoin });
                                        await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objrefer);
                                    }
                                }
                            }
                        }
                    }
                    let accessToken = await helper.generateAccessToken({ userid: userData._id.toString() });
                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, {mobileverified: true, fcm_token: (fcm_token) ? fcm_token : '', lastloginAt: Date.now() });
                    return responseManager.onSuccess('User login successfully!', { token: accessToken, s3Url: process.env.AWS_BUCKET_URI }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid OTP, please try again' }, res);
                }
            })().catch((error) => {
                return responseManager.badrequest({ message: 'Invalid OTP, please try again' }, res);
            });
        }else if(userData && userData.mobileverified == true){
            const url = process.env.FACTOR_URL + "VERIFY3/" + mobile + "/" + otp;
            (async () => {
                let verifiedOTP = await axios.get(url, config);
                if (verifiedOTP.data.Status == 'Success') {
                    let accessToken = await helper.generateAccessToken({ userid: userData._id.toString() });
                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, { fcm_token: (fcm_token) ? fcm_token : '', lastloginAt: Date.now() });
                    return responseManager.onSuccess('User login successfully!', { token: accessToken, s3Url: process.env.AWS_BUCKET_URI }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid OTP, please try again' }, res);
                }
            })().catch((error) => {
                console.log("error", error);
                return responseManager.badrequest({ message: 'Invalid OTP, please try again' }, res);
            });
        }else{
            return responseManager.badrequest({ message: 'Invalid data to verify user mobile number, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid otp or mobile number to verify user mobile number, please try again' }, res);
    }
});
router.post('/forgotpassword', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile } = req.body;
    if (mobile && mobile != '' && mobile.length == 10) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.users, userModel).findOne({ mobile: mobile }).lean();
        if (checkExisting) {
            const url = process.env.FACTOR_URL + mobile + "/AUTOGEN2";
            let otpSend = await axios.get(url, config);
            if (otpSend.data.Details) {
                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: otpSend.data.Details });
                return responseManager.onSuccess('User mobile identified and otp sent successfully!', { key: otpSend.data.Details }, res);
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid user mobile number, Please try again...' }, res);
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
    if (password && password.trim() != '' && password.length >= 8 && mobile && mobile.length == 10) {
        if ((/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,100}$/.test(password))) {
            let userData = await primary.model(constants.MODELS.users, userModel).findOne({ mobile: mobile }).lean();
            if (userData) {
                let ecnPassword = await helper.passwordEncryptor(password);
                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, { password: ecnPassword });
                return responseManager.onSuccess('User password changed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid user mobile number, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Make sure your password is of at least 8 characters long and must contain, 1 Upper case, 1 Lower case 1 Special character, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to change user password, please try again' }, res);
    }
});
router.post('/deleteuser', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, {status : false});
            return responseManager.onSuccess('User deleted successfully!', 1, res);
        }else{
            return responseManager.onSuccess('Invalid User data to delete user, Please try again!', 0, res);
        }
    }else{
        return responseManager.onSuccess('Invalid User data to delete user, Please try again!', 0, res);
    }
});
module.exports = router;