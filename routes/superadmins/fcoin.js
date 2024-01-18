let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const fileHelper = require('../../utilities/multer.functions');
const allowedContentTypes = require('../../utilities/content-types');
const fcoinintransactionsModel = require('../../models/fcoinintransactions.model');
const fcoinsModel = require('../../models/fcoins.model');
const fcointransactionModel = require('../../models/fcointransactions.model');
const organizerModel = require('../../models/organizers.model');
const userModel = require('../../models/users.model');
const AwsCloud = require('../../utilities/aws');
const mongoose = require('mongoose');
const async = require('async');
router.post('/coinsin', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            const { page, limit, search } = req.body;
            primary.model(constants.MODELS.fcoinintransactions, fcoinintransactionsModel).paginate({
                $or: [
                    { transaction_reference_id : { '$regex' : new RegExp(search, "i") } },
                    { chequeno : { '$regex' : new RegExp(search, "i") } },
                    { bank_name : { '$regex' : new RegExp(search, "i") } },
                    { ifsc_code : { '$regex' : new RegExp(search, "i") } },
                    { amount : { '$regex' : new RegExp(search, "i") } },
                    { coin_amount : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                    { notes : { '$regex' : new RegExp(search, "i") } }
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { "timestamp" : -1 },
                populate: { path: 'createdBy', model: primary.model(constants.MODELS.superadmins, superadminModel), select: "name email mobile country_code profile_pic" },
                lean: true
            }).then((intransactions) => {
                return responseManager.onSuccess('F-Coins In Transactions list!', intransactions, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get coins in list, please try again' }, res);
    }
});
router.post('/coinsout', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            const { page, limit, search } = req.body;
            primary.model(constants.MODELS.fcointransactions, fcointransactionModel).paginate({
                $or: [
                    { transaction_type : { '$regex' : new RegExp(search, "i") } }
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { "timestamp" : -1 },
                lean: true
            }).then((outtransactions) => {
                if(outtransactions && outtransactions.docs && outtransactions.docs.length > 0){
                    let finalData = [];
                    async.forEachSeries(outtransactions.docs, (redeem, next_redeem) => {
                        ( async () => {
                            if(redeem.receiver_id != null){
                                let receiverorganiser = await primary.model(constants.MODELS.organizers, organizerModel).findById(redeem.receiver_id).select('name email mobile profile_pic').lean();
                                if(receiverorganiser){
                                    redeem.receiver_id = receiverorganiser;
                                }else{
                                    let receiveruser = await primary.model(constants.MODELS.users, userModel).findById(redeem.receiver_id).select('name email mobile profile_pic').lean();
                                    if(receiveruser){
                                        receiveruser.profile_pic = receiveruser.profile_pic;
                                        delete receiveruser.profile_pic;
                                        redeem.receiver_id = receiveruser;
                                    }
                                }
                            }
                            if(redeem.sender_id != null){
                                let senderorganiser = await primary.model(constants.MODELS.organizers, organizerModel).findById(redeem.sender_id).select('name email mobile profile_pic').lean();
                                if(senderorganiser){
                                    redeem.sender_id = senderorganiser;
                                }else{
                                    let senderuser = await primary.model(constants.MODELS.users, userModel).findById(redeem.sender_id).select('name email mobile profile_pic').lean();
                                    if(senderuser){
                                        senderuser.profile_pic = senderuser.profile_pic;
                                        delete senderuser.profile_pic;
                                        redeem.sender_id = senderuser;
                                    }
                                }
                            }
                            if(redeem.transaction_type == 'refer'){
                                if(redeem.refer_data && Object.keys(redeem.refer_data).length > 0){
                                    if(redeem.refer_data.to_refer != null){
                                        let receiverorganiser = await primary.model(constants.MODELS.organizers, organizerModel).findById(redeem.refer_data.to_refer).select('name email mobile profile_pic').lean();
                                        if(receiverorganiser){
                                            redeem.refer_data.to_refer = receiverorganiser;
                                        }else{
                                            let receiveruser = await primary.model(constants.MODELS.users, userModel).findById(redeem.refer_data.to_refer).select('name email mobile profile_pic').lean();
                                            if(receiveruser){
                                                receiveruser.profile_pic = receiveruser.profile_pic;
                                                delete receiveruser.profile_pic;
                                                redeem.refer_data.to_refer = receiveruser;
                                            }
                                        }
                                    }
                                    if(redeem.refer_data.from_refer != null){
                                        let senderorganiser = await primary.model(constants.MODELS.organizers, organizerModel).findById(redeem.refer_data.from_refer).select('name email mobile profile_pic').lean();
                                        if(senderorganiser){
                                            redeem.refer_data.from_refer = senderorganiser;
                                        }else{
                                            let senderuser = await primary.model(constants.MODELS.users, userModel).findById(redeem.refer_data.from_refer).select('name email mobile profile_pic').lean();
                                            if(senderuser){
                                                senderuser.profile_pic = senderuser.profile_pic;
                                                delete senderuser.profile_pic;
                                                redeem.refer_data.from_refer = senderuser;
                                            }
                                        }
                                    }
                                }
                            }
                            finalData.push(redeem);
                            next_redeem();
                        })().catch((error) => {return responseManager.onError(error, res);});
                    }, () => {
                        outtransactions.docs = finalData;
                        return responseManager.onSuccess('F-Coins Out Transactions list!', outtransactions, res);
                    });
                }
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get coins out list, please try again' }, res);
    }
});
router.post('/generatecoins', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(((req.body.transaction_reference_id && req.body.transaction_reference_id.trim() != '') || (req.body.chequeno && req.body.chequeno.trim() != '')) && req.body.amount && !isNaN(req.body.amount) && parseFloat(req.body.amount) > 0){
                if (req.file) {
                    if (allowedContentTypes.imagedocarray.includes(req.file.mimetype)) {
                        let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                        if (filesizeinMb <= 300) {
                            AwsCloud.saveToS3(req.file.buffer, req.token.superadminid.toString(), req.file.mimetype, 'generatecoin').then((result) => {
                                ( async () => {
                                    if(result && result.data && result.data.Key){
                                        let obj = {
                                            transaction_reference_id : (req.body.transaction_reference_id.trim()) ? req.body.transaction_reference_id.trim() : '',
                                            chequeno : (req.body.chequeno.trim()) ? req.body.chequeno.trim() : '',
                                            bank_name : (req.body.bank_name.trim()) ? req.body.bank_name.trim() : '',
                                            ifsc_code : (req.body.ifsc_code.trim()) ? req.body.ifsc_code.trim() : '',
                                            amount : (req.body.amount && parseFloat(req.body.amount) > 0) ? parseFloat(req.body.amount) : 0,
                                            coin_amount : (req.body.amount && parseFloat(req.body.amount) > 0) ? parseFloat(parseFloat(req.body.amount) * 25) : 0,
                                            description : (req.body.description.trim()) ? req.body.description.trim() : '',
                                            notes : (req.body.notes.trim()) ? req.body.notes.trim() : '',
                                            document_file : result.data.Key,
                                            timestamp : Date.now(),
                                            createdBy : new mongoose.Types.ObjectId(req.token.superadminid)
                                        };
                                        let currentCoins = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                                        if(currentCoins && currentCoins.length > 0){
                                            let newCoin = parseFloat(parseFloat(currentCoins[0].fcoins) + parseFloat(parseFloat(req.body.amount) * 25));
                                            await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoins[0]._id, {fcoins : newCoin});
                                            let insertedData = await primary.model(constants.MODELS.fcoinintransactions, fcoinintransactionsModel).create(obj);
                                            return responseManager.onSuccess('F-coin added successfully!', insertedData, res);
                                        }else{
                                            return responseManager.badrequest({ message: 'Something went wrong no coin found to update Sorry, Try again' }, res);
                                        }                                        
                                    }else{
                                        return responseManager.badrequest({ message: 'Document file must be <= 300 MB, please try again' }, res);
                                    }
                                })().catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }else{
                            return responseManager.badrequest({ message: 'Document file must be <= 10 MB, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Invalid file type only Document / Image files allowed, please try again' }, res);
                    }
                }else{
                    let obj = {
                        transaction_reference_id : (req.body.transaction_reference_id.trim()) ? req.body.transaction_reference_id.trim() : '',
                        chequeno : (req.body.chequeno.trim()) ? req.body.chequeno.trim() : '',
                        bank_name : (req.body.bank_name.trim()) ? req.body.bank_name.trim() : '',
                        ifsc_code : (req.body.ifsc_code.trim()) ? req.body.ifsc_code.trim() : '',
                        amount : (req.body.amount && parseFloat(req.body.amount) > 0) ? parseFloat(req.body.amount) : 0,
                        coin_amount : (req.body.amount && parseFloat(req.body.amount) > 0) ? parseFloat(parseFloat(req.body.amount) * 25) : 0,
                        description : (req.body.description.trim()) ? req.body.description.trim() : '',
                        notes : (req.body.notes.trim()) ? req.body.notes.trim() : '',
                        document_file : '',
                        timestamp : Date.now(),
                        createdBy : new mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    let currentCoins = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
                    if(currentCoins && currentCoins.length > 0){
                        let newCoin = parseFloat(parseFloat(currentCoins[0].fcoins) + parseFloat(parseFloat(req.body.amount) * 25));
                        await primary.model(constants.MODELS.fcoins, fcoinsModel).findByIdAndUpdate(currentCoins[0]._id, {fcoins : newCoin});
                        let insertedData = await primary.model(constants.MODELS.fcoinintransactions, fcoinintransactionsModel).create(obj);
                        return responseManager.onSuccess('F-coin added successfully!', insertedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Something went wrong no coin found to update Sorry, Try again' }, res);
                    }
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid transaction or reference id or cheque no or amount to generate coin, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to generate coin, please try again' }, res);
    }
});
router.get('/coinbalance', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            let currentCoins = await primary.model(constants.MODELS.fcoins, fcoinsModel).find({}).lean();
            if(currentCoins && currentCoins.length > 0){
                return responseManager.onSuccess('F-coin Current Balance!', currentCoins[0], res);
            }else{
                return responseManager.badrequest({ message: 'Something went wrong no coin found to display Sorry, Try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get coin current balance, please try again' }, res);
    }
});
module.exports = router;