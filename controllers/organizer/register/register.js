const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const organizerModel = require('../../../models/organizers.model');
const axios = require('axios');
const mongoose = require('mongoose');
const config = {
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    }
};
exports.registerneworganizer = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, email, mobile, country_code, password, refer_code, fcm_token, agentid, country_wise_contact } = req.body;
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    if (refer_code && refer_code.trim().length > 0) {
        let checkReferenceCodeOrg = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ "my_refer_code": refer_code.trim() }).lean();
        if (checkReferenceCodeOrg == null) {
            let checkReferenceCodeUser = await primary.model(constants.MODELS.users, userModel).findOne({ "my_refer_code": refer_code.trim() }).lean();
            if (checkReferenceCodeUser == null) {
                return responseManager.badrequest({ message: 'Invalid Reference Code, Please try again with valid Reference Code Or Leave it Empty its Optional...' }, res);
            } else {
                if (name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && mobile && mobile.length == 10 && country_code && country_code.trim() != '' && password && password.length >= 8) {
                    if (password.length >= 8) {
                        let ecnPassword = await helper.passwordEncryptor(password);
                        let my_referCode = await helper.makeid(6);
                        let checkExisting = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ $or: [{ mobile: mobile }, { email: email }] }).lean();
                        if (checkExisting == null) {
                            let obj = {
                                name: (name) ? name.trim() : '',
                                email: (email) ? email.trim() : '',
                                mobile: (mobile) ? mobile.trim() : '',
                                country_code: (country_code) ? country_code.trim() : '',
                                password: ecnPassword,
                                refer_code: (refer_code) ? refer_code.trim() : '',
                                my_refer_code: (my_referCode) ? my_referCode.trim() : '',
                                fcm_token: (fcm_token) ? fcm_token.trim() : '',
                                is_approved: true,
                                status: true,
                                f_coin: parseInt(0),
                                mobileverified: false,
                                businessProfile: {},
                                country_wise_contact: (country_wise_contact) ? country_wise_contact : {},
                                agentid: (agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)) ? mongoose.Types.ObjectId(agentid) : null
                            };
                            // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                            // let otpSend = await axios.get(url, config);
                            // console.log('otpSend 01', otpSend);
                            // if (otpSend.data.Details) {
                                obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                                let organiserData = await primary.model(constants.MODELS.organizers, organizerModel).create(obj);
                                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organiserData._id, { channelID: organiserData.mobile.toString() + '_' + organiserData._id.toString() });
                                return responseManager.onSuccess('Organizer register successfully!', { key: '123456', organizerid: organiserData._id.toString() }, res);
                            // } else {
                            //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                            // }
                        } else {
                            if (checkExisting.mobileverified == false) {
                                let obj = {
                                    name: (name) ? name.trim() : '',
                                    email: (email) ? email.trim() : '',
                                    mobile: (mobile) ? mobile.trim() : '',
                                    country_code: (country_code) ? country_code.trim() : '',
                                    password: ecnPassword,
                                    refer_code: (refer_code) ? refer_code.trim() : '',
                                    my_refer_code: (my_referCode) ? my_referCode.trim() : '',
                                    fcm_token: (fcm_token) ? fcm_token.trim() : '',
                                    is_approved: true,
                                    status: true,
                                    mobileverified: false,
                                    f_coin: parseInt(0),
                                    businessProfile: {},
                                    country_wise_contact: (country_wise_contact) ? country_wise_contact : {},
                                    agentid: (agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)) ? mongoose.Types.ObjectId(agentid) : null
                                };
                                // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                                // let otpSend = await axios.get(url, config);
                                // console.log('otpSend 02', otpSend);
                                // if (otpSend.data.Details) {
                                    obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                                    await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(checkExisting._id, obj);
                                    let finalorganiserData = await primary.model(constants.MODELS.organizers, organizerModel).findById(checkExisting._id).lean();
                                    await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(finalorganiserData._id, { channelID: finalorganiserData.mobile.toString() + '_' + finalorganiserData._id.toString() });
                                    return responseManager.onSuccess('Organizer register successfully!', { key: '123456', organizerid: finalorganiserData._id.toString() }, res);
                                // } else {
                                //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                                // }
                            } else {
                                return responseManager.badrequest({ message: 'Organizer already exist with same mobile or email, Please try again...' }, res);
                            }
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Make sure your password is at least 8 characters long..., please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid data to register organizer, please try again' }, res);
                }
            }
        } else {
            if (name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && mobile && mobile.length == 10 && country_code && country_code.trim() != '' && password && password.length >= 8) {
                if (password.length >= 8) {
                    let ecnPassword = await helper.passwordEncryptor(password);
                    let my_referCode = await helper.makeid(6);
                    let checkExisting = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ $or: [{ mobile: mobile }, { email: email }] }).lean();
                    if (checkExisting == null) {
                        let obj = {
                            name: (name) ? name.trim() : '',
                            email: (email) ? email.trim() : '',
                            mobile: (mobile) ? mobile.trim() : '',
                            country_code: (country_code) ? country_code.trim() : '',
                            password: ecnPassword,
                            refer_code: (refer_code) ? refer_code.trim() : '',
                            my_refer_code: (my_referCode) ? my_referCode.trim() : '',
                            fcm_token: (fcm_token) ? fcm_token.trim() : '',
                            is_approved: true,
                            status: true,
                            f_coin: parseInt(0),
                            mobileverified: false,
                            businessProfile: {},
                            country_wise_contact: (country_wise_contact) ? country_wise_contact : {},
                            agentid: (agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)) ? mongoose.Types.ObjectId(agentid) : null
                        };
                        // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                        // let otpSend = await axios.get(url, config);
                        // console.log('otpSend 03', otpSend);
                        // if (otpSend.data.Details) {
                            obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                            let organiserData = await primary.model(constants.MODELS.organizers, organizerModel).create(obj);
                            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organiserData._id, { channelID: organiserData.mobile.toString() + '_' + organiserData._id.toString() });
                            return responseManager.onSuccess('Organizer register successfully!', { key: '123456', organizerid: organiserData._id.toString() }, res);
                        // } else {
                        //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                        // }
                    } else {
                        if (checkExisting.mobileverified == false) {
                            let obj = {
                                name: (name) ? name.trim() : '',
                                email: (email) ? email.trim() : '',
                                mobile: (mobile) ? mobile.trim() : '',
                                country_code: (country_code) ? country_code.trim() : '',
                                password: ecnPassword,
                                refer_code: (refer_code) ? refer_code.trim() : '',
                                my_refer_code: (my_referCode) ? my_referCode.trim() : '',
                                fcm_token: (fcm_token) ? fcm_token.trim() : '',
                                is_approved: true,
                                status: true,
                                mobileverified: false,
                                f_coin: parseInt(0),
                                businessProfile: {},
                                country_wise_contact: (country_wise_contact) ? country_wise_contact : {},
                                agentid: (agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)) ? mongoose.Types.ObjectId(agentid) : null
                            };
                            // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                            // let otpSend = await axios.get(url, config);
                            // console.log('otpSend 04', otpSend);
                            // if (otpSend.data.Details) {
                                obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(checkExisting._id, obj);
                                let finalorganiserData = await primary.model(constants.MODELS.organizers, organizerModel).findById(checkExisting._id).lean();
                                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(finalorganiserData._id, { channelID: finalorganiserData.mobile.toString() + '_' + finalorganiserData._id.toString() });
                                return responseManager.onSuccess('Organizer register successfully!', { key: '123456', organizerid: finalorganiserData._id.toString() }, res);
                            // } else {
                            //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                            // }
                        } else {
                            return responseManager.badrequest({ message: 'Organizer already exist with same mobile or email, Please try again...' }, res);
                        }
                    }
                } else {
                    return responseManager.badrequest({ message: 'Make sure your password is at least 8 characters long..., please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid data to register organizer, please try again' }, res);
            }
        }
    } else {
        if (name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && mobile && mobile.length == 10 && country_code && country_code.trim() != '' && password && password.length >= 8) {
            if (password.length >= 8) {
                let ecnPassword = await helper.passwordEncryptor(password);
                let my_referCode = await helper.makeid(6);
                let checkExisting = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ $or: [{ mobile: mobile }, { email: email }] }).lean();
                if (checkExisting == null) {
                    let obj = {
                        name: (name) ? name.trim() : '',
                        email: (email) ? email.trim() : '',
                        mobile: (mobile) ? mobile.trim() : '',
                        country_code: (country_code) ? country_code.trim() : '',
                        password: ecnPassword,
                        refer_code: (refer_code) ? refer_code.trim() : '',
                        my_refer_code: (my_referCode) ? my_referCode.trim() : '',
                        fcm_token: (fcm_token) ? fcm_token.trim() : '',
                        is_approved: true,
                        status: true,
                        f_coin: parseInt(0),
                        mobileverified: false,
                        businessProfile: {},
                        country_wise_contact: (country_wise_contact) ? country_wise_contact : {},
                        agentid: (agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)) ? mongoose.Types.ObjectId(agentid) : null
                    };
                    // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                    // let otpSend = await axios.get(url, config);
                    // console.log('otpSend 05', otpSend);
                    // if (otpSend.data.Details) {
                        obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                        let organiserData = await primary.model(constants.MODELS.organizers, organizerModel).create(obj);
                        await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organiserData._id, { channelID: organiserData.mobile.toString() + '_' + organiserData._id.toString() });
                        return responseManager.onSuccess('Organizer register successfully!', { key: '123456', organizerid: organiserData._id.toString() }, res);
                    // } else {
                    //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                    // }
                } else {
                    if (checkExisting.mobileverified == false) {
                        let obj = {
                            name: (name) ? name.trim() : '',
                            email: (email) ? email.trim() : '',
                            mobile: (mobile) ? mobile.trim() : '',
                            country_code: (country_code) ? country_code.trim() : '',
                            password: ecnPassword,
                            refer_code: (refer_code) ? refer_code.trim() : '',
                            my_refer_code: (my_referCode) ? my_referCode.trim() : '',
                            fcm_token: (fcm_token) ? fcm_token.trim() : '',
                            is_approved: true,
                            status: true,
                            mobileverified: false,
                            f_coin: parseInt(0),
                            businessProfile: {},
                            country_wise_contact: (country_wise_contact) ? country_wise_contact : {},
                            agentid: (agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)) ? mongoose.Types.ObjectId(agentid) : null
                        };
                        // const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
                        // let otpSend = await axios.get(url, config);
                        // console.log('otpSend 06', otpSend);
                        // if (otpSend.data.Details) {
                            obj.otpVerifyKey = '123456'; //otpSend.data.Details;
                            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(checkExisting._id, obj);
                            let finalorganiserData = await primary.model(constants.MODELS.organizers, organizerModel).findById(checkExisting._id).lean();
                            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(finalorganiserData._id, { channelID: finalorganiserData.mobile.toString() + '_' + finalorganiserData._id.toString() });
                            return responseManager.onSuccess('Organizer register successfully!', { key: '123456', organizerid: finalorganiserData._id.toString() }, res);
                        // } else {
                        //     return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
                        // }
                    } else {
                        return responseManager.badrequest({ message: 'Organizer already exist with same mobile or email, Please try again...' }, res);
                    }
                }
            } else {
                return responseManager.badrequest({ message: 'Make sure your password is at least 8 characters long..., please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid data to register organizer, please try again' }, res);
        }
    }
};