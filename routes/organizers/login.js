let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const userModel = require('../../models/users.model');
const fcointransactionModel = require('../../models/fcointransactions.model');
const mongoose = require('mongoose');
router.post('/', async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { mobile, password } = req.body;
    if (mobile && password && mobile.length == 10 && password.length >= 6) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ mobile: mobile, is_approved: true, status: true, mobileverified: true }).lean();
        if (organizerData && organizerData != null && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            let decPassword = await helper.passwordDecryptor(organizerData.password);
            if (decPassword == password) {
                let accessToken = await helper.generateAccessToken({ organizerid: organizerData._id.toString() });
                if ((organizerData.last_login_at == undefined || organizerData.last_login_at == null || organizerData.last_login_at == 0) && (organizerData.first_login_at == undefined)) {
                    if (organizerData.refer_code && organizerData.refer_code != '' && organizerData.refer_code != null && organizerData.refer_code != 0) {
                        let referbyOrganiser = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ my_refer_code: organizerData.refer_code }).lean();
                        if (referbyOrganiser) {
                            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(referbyOrganiser._id, { f_coin: (referbyOrganiser.f_coin) ? parseFloat(referbyOrganiser.f_coin + 10) : parseFloat(10) });
                            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, { f_coin: parseFloat(20), first_login_at: Date.now() });
                            let objmain = {
                                receiver_id: mongoose.Types.ObjectId(organizerData._id),
                                sender_id: null,
                                transaction_type: 'refer',
                                transaction_icon: 'global/tricons/refer.png',
                                f_coins: parseFloat(20),
                                refer_data: {
                                    from_refer: mongoose.Types.ObjectId(referbyOrganiser._id),
                                    to_refer: mongoose.Types.ObjectId(organizerData._id),
                                },
                                timestamp: Date.now()
                            };
                            await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objmain);
                            let objrefer = {
                                receiver_id: mongoose.Types.ObjectId(referbyOrganiser._id),
                                sender_id: null,
                                transaction_type: 'refer',
                                transaction_icon: 'global/tricons/refer.png',
                                f_coins: parseFloat(10),
                                refer_data: {
                                    from_refer: mongoose.Types.ObjectId(referbyOrganiser._id),
                                    to_refer: mongoose.Types.ObjectId(organizerData._id),
                                },
                                timestamp: Date.now()
                            };
                            await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objrefer);
                        } else {
                            let referbyuser = await primary.model(constants.MODELS.users, userModel).findOne({ my_refer_code: organizerData.refer_code }).lean();
                            if (referbyuser) {
                                await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(referbyuser._id, { f_coin: (referbyuser.f_coin) ? parseFloat(referbyuser.f_coin + 10) : parseFloat(10) });
                                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, { f_coin: parseFloat(20), first_login_at: Date.now() });
                                let objmain = {
                                    receiver_id: mongoose.Types.ObjectId(organizerData._id),
                                    sender_id: null,
                                    transaction_type: 'refer',
                                    transaction_icon: 'global/tricons/refer.png',
                                    f_coins: parseFloat(20),
                                    refer_data: {
                                        from_refer: mongoose.Types.ObjectId(referbyuser._id),
                                        to_refer: mongoose.Types.ObjectId(organizerData._id),
                                    },
                                    timestamp: Date.now()
                                };
                                await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objmain);
                                let objrefer = {
                                    receiver_id: mongoose.Types.ObjectId(referbyuser._id),
                                    sender_id: null,
                                    transaction_type: 'refer',
                                    transaction_icon: 'global/tricons/refer.png',
                                    f_coins: parseFloat(10),
                                    refer_data: {
                                        from_refer: mongoose.Types.ObjectId(referbyuser._id),
                                        to_refer: mongoose.Types.ObjectId(organizerData._id),
                                    },
                                    timestamp: Date.now()
                                };
                                await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(objrefer);
                            }
                        }
                    }
                }
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, { last_login_at: Date.now() });
                return responseManager.onSuccess('Organizer login successfully!', { token: accessToken }, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid password, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid mobile or password please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid mobile or password please try again' }, res);
    }
});
module.exports = router;
