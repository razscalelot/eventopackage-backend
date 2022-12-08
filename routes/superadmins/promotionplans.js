let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const promotionplanModel = require('../../models/promotionplans.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.promotionplans, promotionplanModel).paginate({
                $or: [
                    { planname : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                lean: true
            }).then((plans) => {
                return responseManager.onSuccess('Promotional Plans list!', plans, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get plans list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { planid, planname, description, notification_amount, sms_amount, email_amount, combo_amount, total_users, status } = req.body;
        if(planname && planname != '' && notification_amount && !isNaN(notification_amount) && sms_amount && !isNaN(sms_amount) && email_amount && !isNaN(email_amount) && combo_amount && !isNaN(combo_amount) && total_users && !isNaN(total_users)){
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
            if(superadmin){
                if(planid && planid != '' && mongoose.Types.ObjectId.isValid(planid)){
                    let existingplan = await primary.model(constants.MODELS.promotionplans, promotionplanModel).findOne({_id : {$ne : mongoose.Types.ObjectId(planid)}, planname : planname}).lean();
                    if(existingplan == null){
                        let obj = {
                            planname : planname,
                            description : description,
                            notification_amount : parseFloat(notification_amount),
                            sms_amount : parseFloat(sms_amount),
                            email_amount : parseFloat(email_amount),
                            combo_amount : parseFloat(combo_amount),
                            total_users : parseInt(total_users),
                            status : status,
                            updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                        };
                        await primary.model(constants.MODELS.promotionplans, promotionplanModel).findByIdAndUpdate(planid, obj);
                        let updatedPlanData = await primary.model(constants.MODELS.promotionplans, promotionplanModel).findById(planid).lean();
                        if(updatedPlanData && updatedPlanData != null){
                            return responseManager.onSuccess('Plan updated sucecssfully!', updatedPlanData, res);
                        }else{
                            return responseManager.badrequest({ message: 'Invalid plan id to update plan data, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Plan name can not be identical, please try again' }, res);
                    }
                }else{
                    let existingplan = await primary.model(constants.MODELS.promotionplans, promotionplanModel).findOne({planname : planname}).lean();
                    if(existingplan == null) {
                        let obj = {
                            planname : planname,
                            description : description,
                            notification_amount : parseFloat(notification_amount),
                            sms_amount : parseFloat(sms_amount),
                            email_amount : parseFloat(email_amount),
                            combo_amount : parseFloat(combo_amount),
                            total_users : parseInt(total_users),
                            status : status,
                            createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                            updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                        };
                        let createdPlan = await primary.model(constants.MODELS.promotionplans, promotionplanModel).create(obj);
                        let createdPlanData = await primary.model(constants.MODELS.promotionplans, promotionplanModel).findById(createdPlan._id).lean();
                        if(createdPlanData && createdPlanData != null){
                            return responseManager.onSuccess('Plan created sucecssfully!', createdPlanData, res);
                        }else{
                            return responseManager.badrequest({ message: 'Invalid plan data to create plan, please try again' }, res);
                        }
                    }else{
                        return responseManager.badrequest({ message: 'Plan name can not be identical, please try again' }, res);
                    }
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid token to save plan data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid data to save plan data, Plan name can not be empty and notification, email, sms and user count must be numbers only, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token save plan data, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { planid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(planid && planid != '' && mongoose.Types.ObjectId.isValid(planid)){
                await primary.model(constants.MODELS.promotionplans, promotionplanModel).findByIdAndRemove(planid);
                return responseManager.onSuccess('Plan removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid plan id to remove plan data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to remove plan data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.promotionplans, promotionplanModel).find({}).then((planslist) => {
                return responseManager.onSuccess('Plans list!', planslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get plans list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { planid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(planid && planid != '' && mongoose.Types.ObjectId.isValid(planid)){
                let planData = await primary.model(constants.MODELS.promotionplans, promotionplanModel).findById(planid);
                return responseManager.onSuccess('Plan data!', planData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid plan id to get plan data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get plan data, please try again' }, res);
    }
});
module.exports = router;