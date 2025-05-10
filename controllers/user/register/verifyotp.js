const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const userModel = require('../../../models/users.model');
const organizerModel = require('../../../models/organizers.model');
const fcointransactionModel = require('../../../models/fcointransactions.model');
const fcoinsModel = require('../../../models/fcoins.model');
const axios = require('axios');
const mongoose = require('mongoose');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
exports.verifyotpforuser = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { key, otp, mobile, fcm_token } = req.body;
    if (key && key.trim() != '' && otp && otp.trim() != '' && otp.length == 6 && mobile && mobile.length == 10) {
        let userData = await primary.model(constants.MODELS.users, userModel).findOne({ mobile: mobile, otpVerifyKey: key }).lean();
        if (userData && userData.mobileverified == false) {
            // const url = process.env.FACTOR_URL + "VERIFY3/" + mobile + "/" + otp;
            (async () => {
                // let verifiedOTP = await axios.get(url, config);
                if (otp == '123456' || otp == 123456) {
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
                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, { mobileverified: true, fcm_token: (fcm_token) ? fcm_token : '', lastloginAt: Date.now() });
                    return responseManager.onSuccess('User login successfully!', { token: accessToken, s3Url: process.env.AWS_BUCKET_URI }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid OTP, please try again' }, res);
                }
            })().catch((error) => {
                return responseManager.badrequest({ message: 'Invalid OTP, please try again' }, res);
            });
        } else if (userData && userData.mobileverified == true) {
            // const url = process.env.FACTOR_URL + "VERIFY3/" + mobile + "/" + otp;
            (async () => {
                // let verifiedOTP = await axios.get(url, config);
                if (otp == '123456' || otp == 123456) { // verifiedOTP.data.Status == 'Success'
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
        } else {
            return responseManager.badrequest({ message: 'Invalid data to verify user mobile number, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid otp or mobile number to verify user mobile number, please try again' }, res);
    }
};