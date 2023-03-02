let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const equipmentModel = require('../../models/equipments.model');
const async = require('async');
const { default: mongoose } = require("mongoose");
router.post('/approve', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { equipmentid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(equipmentid && equipmentid != '' && mongoose.Types.ObjectId.isValid(equipmentid)){
                let equipmentData = await primary.model(constants.MODELS.equipments, equipmentModel).findById(equipmentid).lean();
                if(equipmentData){
                    if(equipmentData.is_approved == false){
                        await primary.model(constants.MODELS.equipments, equipmentModel).findByIdAndUpdate(equipmentid, {is_approved : true});
                        let updatedData = await primary.model(constants.MODELS.equipments, equipmentModel).findById(equipmentid).lean();
                        return responseManager.onSuccess('Equipment approved sucecssfully!', updatedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Equipment is already approved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Equipment data not found to approve equipment, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid equipment id to approve equipment, please try again' }, res);
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
        const { equipmentid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(equipmentid && equipmentid != '' && mongoose.Types.ObjectId.isValid(equipmentid)){
                let equipmentData = await primary.model(constants.MODELS.equipments, equipmentModel).findById(equipmentid).lean();
                if(equipmentData){
                    if(equipmentData.is_approved == true){
                        await primary.model(constants.MODELS.equipments, equipmentModel).findByIdAndUpdate(equipmentid, {is_approved : false});
                        let updatedData = await primary.model(constants.MODELS.equipments, equipmentModel).findById(equipmentid).lean();
                        return responseManager.onSuccess('Equipment disapproved sucecssfully!', updatedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Equipment is already disapproved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Equipment data not found to disapprove, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid equipment id to disapprove equipment, please try again' }, res);
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
        const { equipmentid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(equipmentid && equipmentid != '' && mongoose.Types.ObjectId.isValid(equipmentid)){
                await primary.model(constants.MODELS.equipments, equipmentModel).findByIdAndRemove(equipmentid);
                return responseManager.onSuccess('Equipment removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid equipment id to remove equipment data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;