const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const userModel = require('../../../models/users.model');
const organizerModel = require('../../../models/organizers.model');
const axios = require('axios');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
exports.registernewuser = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile, country_code, refer_code, fcm_token } = req.body;
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    if (refer_code && refer_code.trim().length > 0) {
        let checkReferenceCodeUser = await primary.model(constants.MODELS.users, userModel).findOne({ "my_refer_code": refer_code.trim() }).lean();
        if (checkReferenceCodeUser == null) {
            let checkReferenceCodeOrg = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ "my_refer_code": refer_code.trim() }).lean();
            if (checkReferenceCodeOrg == null) {
                return responseManager.badrequest({ message: 'Invalid Reference Code, Please try again with valid Reference Code Or Leave it Empty its Optional...' }, res);
            } else {
                if (mobile && mobile.length == 10 && country_code && country_code.trim() != '') {
                    let my_referCode = await helper.makeid(6);
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
                            f_coin: parseInt(0),
                            about: '',
                            profilepic: '',
                            mobileverified: false
                        };
                        // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                        // let otpSend = await axios.get(url, config);
                        // if (otpSend.data.Details) {
                            obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                            let createdUser = await primary.model(constants.MODELS.users, userModel).create(obj);
                            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(createdUser._id, { channelID: createdUser.mobile.toString() + '_' + createdUser._id.toString() });
                            return responseManager.onSuccess('User register successfully!', { key: '123456' }, res);
                        // } else {
                        //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                        // }
                    } else {
                        if (checkExisting.mobileverified == false) {
                            // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                            // let otpSend = await axios.get(url, config);
                            // if (otpSend.data.Details) {
                                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: '123456', channelID: checkExisting.mobile.toString() + '_' + checkExisting._id.toString() });
                                return responseManager.onSuccess('User register successfully!', { key: '123456' }, res);
                            // } else {
                            //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                            // }
                        } else {
                            return responseManager.badrequest({ message: 'User already exist with same mobile, Please Login...' }, res);
                        }
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid data to register user, please try again' }, res);
                }
            }
        } else {
            if (mobile && mobile.length == 10 && country_code && country_code.trim() != '') {
                let my_referCode = await helper.makeid(6);
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
                        f_coin: parseInt(0),
                        about: '',
                        profilepic: '',
                        mobileverified: false
                    };
                    // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                    // let otpSend = await axios.get(url, config);
                    // if (otpSend.data.Details) {
                        obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                        let createdUser = await primary.model(constants.MODELS.users, userModel).create(obj);
                        await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(createdUser._id, { channelID: createdUser.mobile.toString() + '_' + createdUser._id.toString() });
                        return responseManager.onSuccess('User register successfully!', { key: '123456' }, res);
                    // } else {
                    //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                    // }
                } else {
                    if (checkExisting.mobileverified == false) {
                        // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                        // let otpSend = await axios.get(url, config);
                        // if (otpSend.data.Details) {
                            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: '123456', channelID: checkExisting.mobile.toString() + '_' + checkExisting._id.toString() });
                            return responseManager.onSuccess('User register successfully!', { key: '123456' }, res);
                        // } else {
                        //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                        // }
                    } else {
                        return responseManager.badrequest({ message: 'User already exist with same mobile, Please Login...' }, res);
                    }
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid data to register user, please try again' }, res);
            }
        }
    } else {
        if (mobile && mobile.length == 10 && country_code && country_code.trim() != '') {
            let my_referCode = await helper.makeid(6);
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
                    f_coin: parseInt(0),
                    about: '',
                    profilepic: '',
                    mobileverified: false
                };
                // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                // let otpSend = await axios.get(url, config);
                // if (otpSend.data.Details) {
                    obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                    let createdUser = await primary.model(constants.MODELS.users, userModel).create(obj);
                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(createdUser._id, { channelID: createdUser.mobile.toString() + '_' + createdUser._id.toString() });
                    return responseManager.onSuccess('User register successfully!', { key: '123456' }, res);
                // } else {
                //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                // }
            } else {
                if (checkExisting.mobileverified == false) {
                    // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                    // let otpSend = await axios.get(url, config);
                    // if (otpSend.data.Details) {
                        await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(checkExisting._id, { otpVerifyKey: '123456', channelID: checkExisting.mobile.toString() + '_' + checkExisting._id.toString() });
                        return responseManager.onSuccess('User register successfully!', { key: '123456' }, res);
                    // } else {
                    //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                    // }
                } else {
                    return responseManager.badrequest({ message: 'User already exist with same mobile, Please Login...' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid data to register user, please try again' }, res);
        }
    }
};