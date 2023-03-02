let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const serviceModel = require('../../models/service.model');
const async = require('async');
const { default: mongoose } = require("mongoose");
router.post('/approve', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { serviceid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(serviceid && serviceid != '' && mongoose.Types.ObjectId.isValid(serviceid)){
                let serviceData = await primary.model(constants.MODELS.services, serviceModel).findById(serviceid).lean();
                console.log("serviceData", serviceData);
                if(serviceData){
                    if(serviceData.is_approved == false){
                        await primary.model(constants.MODELS.services, serviceModel).findByIdAndUpdate(serviceid, {is_approved : true});
                        let updatedData = await primary.model(constants.MODELS.services, serviceModel).findById(serviceid).lean();
                        return responseManager.onSuccess('Service approved sucecssfully!', updatedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Service is already approved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Service data not found to approve service, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid service id to approve service, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/disapprove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { serviceid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(serviceid && serviceid != '' && mongoose.Types.ObjectId.isValid(serviceid)){
                let serviceData = await primary.model(constants.MODELS.services, serviceModel).findById(serviceid).lean();
                if(serviceData){
                    if(serviceData.is_approved == true){
                        await primary.model(constants.MODELS.services, serviceModel).findByIdAndUpdate(serviceid, {is_approved : false});
                        let updatedData = await primary.model(constants.MODELS.services, serviceModel).findById(serviceid).lean();
                        return responseManager.onSuccess('Service disapproved sucecssfully!', updatedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Service is already disapproved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Service data not found to disapprove, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid service id to disapprove service, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { serviceid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(serviceid && serviceid != '' && mongoose.Types.ObjectId.isValid(serviceid)){
                await primary.model(constants.MODELS.services, serviceModel).findByIdAndRemove(serviceid);
                return responseManager.onSuccess('Service removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid service id to remove service data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;