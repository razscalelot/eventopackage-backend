let express = require("express");
let router = express.Router();
const mongoConnection = require('../utilities/connections');
const responseManager = require('../utilities/response.manager');
const constants = require('../utilities/constants');
const eventbookingModel = require('../models/eventbookings.model');
const mongoose = require('mongoose');
router.post('/', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { eventbookedid } = req.body;
    if (eventbookedid && mongoose.Types.ObjectId.isValid(eventbookedid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let eventBookingData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).findOne({ _id: mongoose.Types.ObjectId(eventbookedid) }).lean();
        if (eventBookingData && eventBookingData.status == 'Paid') {
            return responseManager.onSuccess('Qr code verifyed successfull', { status: true }, res);
        } else {
            return responseManager.onSuccess('Qr code verifyed failed', { status: false }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid qr code value please try again' }, res);
    }
});
router.post('/send', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { receiverid, coinamount, remark } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let senderOrganiser = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (senderOrganiser && senderOrganiser.status == true && senderOrganiser.mobileverified == true && senderOrganiser.is_approved == true) {
            if (senderOrganiser.f_coin > 0 && senderOrganiser.f_coin >= parseFloat(coinamount)) {
                if (receiverid && mongoose.Types.ObjectId.isValid(receiverid)) {
                    let receiverOrganiser = await primary.model(constants.MODELS.organizers, organizerModel).findById(receiverid).lean();
                    if (receiverOrganiser && receiverOrganiser.status == true && receiverOrganiser.mobileverified == true && receiverOrganiser.is_approved == true) {
                        await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(senderOrganiser._id, { f_coin: parseFloat(senderOrganiser.f_coin - coinamount) });
                        await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(receiverOrganiser._id, {f_coin : parseFloat(receiverOrganiser.f_coin + coinamount)});
                        let obj = {
                            receiver_id :  mongoose.Types.ObjectId(receiverOrganiser._id),
                            sender_id : mongoose.Types.ObjectId(senderOrganiser._id),
                            transaction_type : 'redeem_by_bank',
                            transaction_icon : 'global/tricons/refer.png',
                            f_coins : parseFloat(coinamount),
                            refer_data : {
                                from_refer : mongoose.Types.ObjectId(senderOrganiser._id),
                                to_refer : mongoose.Types.ObjectId(receiverOrganiser._id),
                            },
                            timestamp : Date.now()
                        };
                        await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).create(obj);
                    } else {

                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid organiser id, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid coin amount, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organiser id, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
});
module.exports = router;
