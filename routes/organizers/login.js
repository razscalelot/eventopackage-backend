let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const userModel = require('../../models/users.model');
const fcointransactionModel = require('../../models/fcointransactions.model');
const fcoinsModel = require('../../models/fcoins.model');
const mongoose = require('mongoose');
const axios = require('axios');
const config = {
    headers : {
        'content-type': 'application/x-www-form-urlencoded'
    }
};

router.post('/', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile, password } = req.body;
    if(mobile && password && mobile.length == 10 && password.length >= 6){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findOne({mobile: mobile}).lean();
        if(organizerData && organizerData != null && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            let decPassword = await helper.passwordDecryptor(organizerData.password);
            if(decPassword == password){
                let accessToken = await helper.generateAccessToken({ organizerid : organizerData._id.toString() });
                if((organizerData.last_login_at == undefined || organizerData.last_login_at == null || organizerData.last_login_at == 0) && (organizerData.first_login_at == undefined)){
                    if(organizerData.refer_code && organizerData.refer_code != '' && organizerData.refer_code != null && organizerData.refer_code != 0){
                        let referbyOrganiser = await primary.model(constants.MODELS.organizers, organizerModel).findOne({my_refer_code : organizerData.refer_code}).lean();
                        if(referbyOrganiser){
                            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(referbyOrganiser._id, {f_coin : (referbyOrganiser.f_coin) ? parseFloat(referbyOrganiser.f_coin + 10) : parseFloat(10)});
                            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, {f_coin : parseFloat(20), first_login_at : Date.now()});
                            let objmain = {
                                receiver_id :  mongoose.Types.ObjectId(organizerData._id),
                                sender_id : null,
                                transaction_type : 'refer',
                                transaction_icon : 'global/tricons/refer.png',
                                f_coins : parseFloat(20),
                                refer_data : {
                                    from_refer : mongoose.Types.ObjectId(referbyOrganiser._id),
                                    to_refer : mongoose.Types.ObjectId(organizerData._id),
                                },
                                timestamp : Date.now()
                            };
                            let currentCoinsmain = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                            if(currentCoinsmain && currentCoinsmain.length > 0){
                                let newCoin = parseFloat(parseFloat(currentCoinsmain[0].fcoins) - parseFloat(20));
                                await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoinsmain[0]._id, {fcoins : newCoin});
                                await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objmain);
                            }
                            let objrefer = {
                                receiver_id :  mongoose.Types.ObjectId(referbyOrganiser._id),
                                sender_id : null,
                                transaction_type : 'refer',
                                transaction_icon : 'global/tricons/refer.png',
                                f_coins : parseFloat(10),
                                refer_data : {
                                    from_refer : mongoose.Types.ObjectId(referbyOrganiser._id),
                                    to_refer : mongoose.Types.ObjectId(organizerData._id),
                                },
                                timestamp : Date.now()
                            };
                            let currentCoinsrefer = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                            if(currentCoinsrefer && currentCoinsrefer.length > 0){
                                let newCoin = parseFloat(parseFloat(currentCoinsrefer[0].fcoins) - parseFloat(10));
                                await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoinsrefer[0]._id, {fcoins : newCoin});
                                await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objrefer);
                            }
                        }else{
                            let referbyuser = await  primary.model(constants.MODELS.users, userModel).findOne({my_refer_code : organizerData.refer_code}).lean();
                            if(referbyuser) {
                                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(referbyuser._id, {f_coin : (referbyuser.f_coin) ? parseFloat(referbyuser.f_coin + 10) : parseFloat(10)});
                                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, {f_coin : parseFloat(20), first_login_at : Date.now()});
                                let objmain = {
                                    receiver_id :  mongoose.Types.ObjectId(organizerData._id),
                                    sender_id : null,
                                    transaction_type : 'refer',
                                    transaction_icon : 'global/tricons/refer.png',
                                    f_coins : parseFloat(20),
                                    refer_data : {
                                        from_refer : mongoose.Types.ObjectId(referbyuser._id),
                                        to_refer : mongoose.Types.ObjectId(organizerData._id),
                                    },
                                    timestamp : Date.now()
                                };
                                let currentCoinsmain = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                                if(currentCoinsmain && currentCoinsmain.length > 0){
                                    let newCoin = parseFloat(parseFloat(currentCoinsmain[0].fcoins) - parseFloat(20));
                                    await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoinsmain[0]._id, {fcoins : newCoin});
                                    await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objmain);
                                }
                                let objrefer = {
                                    receiver_id :  mongoose.Types.ObjectId(referbyuser._id),
                                    sender_id : null,
                                    transaction_type : 'refer',
                                    transaction_icon : 'global/tricons/refer.png',
                                    f_coins : parseFloat(10),
                                    refer_data : {
                                        from_refer : mongoose.Types.ObjectId(referbyuser._id),
                                        to_refer : mongoose.Types.ObjectId(organizerData._id),
                                    },
                                    timestamp : Date.now()
                                };
                                let currentCoinsrefer = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                                if(currentCoinsrefer && currentCoinsrefer.length > 0){
                                    let newCoin = parseFloat(parseFloat(currentCoinsrefer[0].fcoins) - parseFloat(10));
                                    await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoinsrefer[0]._id, {fcoins : newCoin});
                                    await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objrefer);
                                }
                            }
                        }
                    }
                }
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, {last_login_at : Date.now()});
                return responseManager.onSuccess('Organizer login successfully!', {token : accessToken}, res);
            }else{
                
                return responseManager.badrequest({message : 'Invalid password, please try again'}, res);
            }
        }else if(organizerData && organizerData != null && organizerData.mobileverified == false){
            // const url = process.env.FACTOR_URL + organizerData.mobile + "/AUTOGEN";
            // let otpSend = await axios.get(url, config);
            const url = process.env.FACTOR_URL + mobile + process.env.FACTOR_OTP_URL;
            let otpSend = await axios.get(url,config);
            if (otpSend.data.Details) {
                let newkey = otpSend.data.Details;
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, {otpVerifyKey : newkey});
                return responseManager.onSuccess('Organiser otp sent for mobile verification!', {key : newkey}, res); 
            } else {
                return responseManager.onSuccess('Something went wrong, unable to send otp for given mobile number, please try again!', 0, res);
            }            
        }else{
            return responseManager.badrequest({message : 'Invalid mobile or password please try again'}, res);
        }
    }else{
        return responseManager.badrequest({message : 'Invalid mobile or password please try again'}, res);
    } 
});
module.exports = router;
