const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const userModel = require('../../../models/users.model');
const fcointransactionModel = require('../../../models/fcointransactions.model');
const mongoose = require('mongoose');
const async = require('async');
exports.fcoinhistory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if (userData && userData.status == true && userData.mobileverified == true) {
            let history = await primary.model(constants.MODELS.fcointransactions, fcointransactionModel).find({
                $or: [
                    { receiver_id: mongoose.Types.ObjectId(req.token.userid) },
                    { sender_id: mongoose.Types.ObjectId(req.token.userid) }
                ]
            }).sort({_id : -1}).lean();
            if(history && history.length > 0){
                let finalData = [];
                async.forEachSeries(history, (redeem, next_redeem) => {
                    ( async () => {
                        if(redeem.receiver_id != null){
                            let receiverorganiser = await primary.model(constants.MODELS.organizers, organizerModel).findById(redeem.receiver_id).select('name email mobile profile_pic').lean();
                            if(receiverorganiser){
                                redeem.receiver_id = receiverorganiser;
                            }else{
                                let receiveruser = await primary.model(constants.MODELS.users, userModel).findById(redeem.receiver_id).select('name email mobile profile_pic').lean();
                                if(receiveruser){
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
                                            redeem.refer_data.from_refer = senderuser;
                                        }
                                    }
                                }
                            }
                        }
                        finalData.push(redeem);
                        next_redeem();
                    })().catch((error) => {});
                }, () => {
                    return responseManager.onSuccess("Redeem history...", finalData, res);
                });
            }else{
                return responseManager.onSuccess("Redeem history...", [], res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid userid to get redeem history, please try again' }, res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
};