let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const discountModel = require('../../models/discounts.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search, sortfield, sortoption } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.discounts, discountModel).paginate({
                $or: [
                    { discountname : { '$regex' : new RegExp(search, "i") } },
                    { discounttype : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { [sortfield] : [sortoption] },
                lean: true
            }).then((discountslist) => {
                return responseManager.onSuccess('Discount list!', discountslist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get discount list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { discountid, discountname, discounttype, description, discount, status, tandc, items } = req.body;
        let itemsArray = [];
        if(items && items.length > 0){
            items.forEach(element => {
                itemsArray.push(mongoose.Types.ObjectId(element));
            });
        }
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(discountid && discountid != '' && mongoose.Types.ObjectId.isValid(discountid)){
                let existingdiscount = await primary.model(constants.MODELS.discounts, discountModel).findOne({_id : {$ne : discountid}, discountname : discountname}).lean();
                if(existingdiscount == null){
                    let obj = {
                        discountname : discountname,
                        discounttype : discounttype,
                        description : description,
                        discount : discount,
                        tandc : tandc,
                        status : status,
                        items : itemsArray,
                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    await primary.model(constants.MODELS.discounts, discountModel).findByIdAndUpdate(discountid, obj);
                    return responseManager.onSuccess('Discount updated sucecssfully!', 1, res);
                }else{
                    return responseManager.badrequest({ message: 'Discount name can not be identical, please try again' }, res);
                }
            }else{
                let existingdiscount = await primary.model(constants.MODELS.discounts, discountModel).findOne({discountname : discountname}).lean();
                if(existingdiscount == null) {
                    let obj = {
                        discountname : discountname,
                        discounttype : discounttype,
                        description : description,
                        discount : discount,
                        tandc : tandc,
                        status : status,
                        items : itemsArray,
                        createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    await primary.model(constants.MODELS.discounts, discountModel).create(obj);
                    return responseManager.onSuccess('Discount created sucecssfully!', 1, res);
                }else{
                    return responseManager.badrequest({ message: 'Discount name can not be identical, please try again' }, res);
                }
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to create Discount, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to create Discount, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { discountid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(discountid && discountid != '' && mongoose.Types.ObjectId.isValid(discountid)){
                await primary.model(constants.MODELS.discounts, discountModel).findOneAndRemove(discountid);
                return responseManager.onSuccess('Discount removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid discount id to remove discount data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to remove discount data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.discounts, discountModel).find({}).sort({_id: -1}).then((discountlist) => {
                return responseManager.onSuccess('Discount list!', discountlist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get discount list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { discountid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if( discountid && discountid != '' && mongoose.Types.ObjectId.isValid(discountid)){
                let discountData = await primary.model(constants.MODELS.discounts, discountModel).findById(discountid);
                return responseManager.onSuccess('Discount removed successfully!', discountData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid discount id to get discount data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get discount data, please try again' }, res);
    }
});
module.exports = router;