let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
const ourproductModel = require('../../models/ourproduct.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.ourproduct, ourproductModel).paginate({
                $or: [
                    { ourproductname : { '$regex' : new RegExp(search, "i") } },
                    { description : { '$regex' : new RegExp(search, "i") } },
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { _id : -1 },
                lean: true
            }).then((ourproductlist) => {
                return responseManager.onSuccess('Our product list!', ourproductlist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get our product list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { ourproductid, ourproductname, description, image, socialmedia, links } = req.body;
        let socialmediaArray = [];
        if(socialmedia && socialmedia.length > 0){
            socialmedia.forEach(element => {
                socialmediaArray.push(element);
            });
        }else{
            socialmediaArray.push(socialmedia);
        }
        let linksArray = [];
        if(links && links.length > 0){
            links.forEach(element => {
                linksArray.push(element);
            });
        }else{
            socialmediaArray.push(links);
        }
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(ourproductid && ourproductid != '' && mongoose.Types.ObjectId.isValid(ourproductid)){
                let existingourproduct = await primary.model(constants.MODELS.ourproduct, ourproductModel).findOne({_id : {$ne : ourproductid}, ourproductname : ourproductname}).lean();
                if(existingourproduct == null){
                    let obj = {
                        ourproductname : ourproductname,
                        description : description,
                        image: image,
                        socialmedia : socialmediaArray,
                        links : linksArray,
                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    await primary.model(constants.MODELS.ourproduct, ourproductModel).findByIdAndUpdate(ourproductid, obj);
                    return responseManager.onSuccess('Our product updated sucecssfully!', 1, res);
                }else{
                    return responseManager.badrequest({ message: 'Our product name can not be identical, please try again' }, res);
                }
            }else{
                let existingourproduct = await primary.model(constants.MODELS.ourproduct, ourproductModel).findOne({ourproductname : ourproductname}).lean();
                if(existingourproduct == null) {
                    let obj = {
                        ourproductname : ourproductname,
                        description : description,
                        image: image,
                        socialmedia : socialmediaArray,
                        links : linksArray,
                        createdBy : mongoose.Types.ObjectId(req.token.superadminid),
                        updatedBy : mongoose.Types.ObjectId(req.token.superadminid)
                    };
                    await primary.model(constants.MODELS.ourproduct, ourproductModel).create(obj);
                    return responseManager.onSuccess('Our product created sucecssfully!', 1, res);
                }else{
                    return responseManager.badrequest({ message: 'Our product name can not be identical, please try again' }, res);
                }
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to create our product, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to create our product, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { ourproductid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(ourproductid && ourproductid != '' && mongoose.Types.ObjectId.isValid(ourproductid)){
                await primary.model(constants.MODELS.ourproduct, ourproductModel).findOneAndRemove(ourproductid);
                return responseManager.onSuccess('Our product removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid our product id to remove our product data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to remove our product data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.ourproduct, ourproductModel).find({}).then((ourproductlist) => {
                return responseManager.onSuccess('Our product list!', ourproductlist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get our product, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { ourproductid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if( ourproductid && ourproductid != '' && mongoose.Types.ObjectId.isValid(ourproductid)){
                let ourproductData = await primary.model(constants.MODELS.ourproduct, ourproductModel).findById(ourproductid);
                return responseManager.onSuccess('Our product data!', ourproductData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid our product id to get our product data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get our product data, please try again' }, res);
    }
});
module.exports = router;