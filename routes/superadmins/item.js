let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const itemModel = require('../../models/items.model');
const async = require('async');
const { default: mongoose } = require("mongoose");
router.post('/approve', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { itemid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)){
                let itemData = await primary.model(constants.MODELS.items, itemModel).findById(itemid).lean();
                if(itemData){
                    if(itemData.is_approved == false){
                        await primary.model(constants.MODELS.items, itemModel).findByIdAndUpdate(itemid, {is_approved : true});
                        let updatedData = await primary.model(constants.MODELS.items, itemModel).findById(itemid).lean();
                        return responseManager.onSuccess('Item approved sucecssfully!', updatedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Item is already approved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Item data not found to approve item, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid item id to approve item, please try again' }, res);
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
        const { itemid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)){
                let itemData = await primary.model(constants.MODELS.items, itemModel).findById(itemid).lean();
                console.log("itemData", itemData);
                if(itemData){
                    if(itemData.is_approved == true){
                        await primary.model(constants.MODELS.items, itemModel).findByIdAndUpdate(itemid, {is_approved : false});
                        let updatedData = await primary.model(constants.MODELS.items, itemModel).findById(itemid).lean();
                        return responseManager.onSuccess('Item disapproved sucecssfully!', updatedData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Item is already disapproved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Item data not found to disapprove, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid item id to disapprove item, please try again' }, res);
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
        const { itemid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(itemid && itemid != '' && mongoose.Types.ObjectId.isValid(itemid)){
                await primary.model(constants.MODELS.items, itemModel).findByIdAndRemove(itemid);
                return responseManager.onSuccess('Item removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid item id to remove item data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;