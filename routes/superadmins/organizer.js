let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const superadminModel = require('../../models/superadmins.model');
const eventModel = require('../../models/events.model');
const { default: mongoose } = require("mongoose");
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search, sortfield, sortoption } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.organizers, organizerModel).paginate({
                $or: [
                    { name : { '$regex' : new RegExp(search, "i") } },
                    { email : { '$regex' : new RegExp(search, "i") } },
                    { mobile : { '$regex' : new RegExp(search, "i") } },
                    { refer_code : { '$regex' : new RegExp(search, "i") } },
                    { my_refer_code : { '$regex' : new RegExp(search, "i") } },
                    { about : { '$regex' : new RegExp(search, "i") } },
                    { city : { '$regex' : new RegExp(search, "i") } },
                    { country : { '$regex' : new RegExp(search, "i") } },
                    { state : { '$regex' : new RegExp(search, "i") } },
                    { pincode : { '$regex' : new RegExp(search, "i") } }
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { [sortfield] : [sortoption] },
                lean: true
            }).then((organizersList) => {
                return responseManager.onSuccess('organizers list!', organizersList, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get organizers list, please try again' }, res);
    }
});
router.post('/approve', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid).lean();
                if(organizerData && organizerData.mobileverified == true){
                    if(organizerData.status == false){
                        await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, {status : true});
                        return responseManager.onSuccess('Organizer approved sucecssfully!', 1, res);
                    }else{
                        return responseManager.badrequest({ message: 'Organizer is already approved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Organizer mobile number is not verified yet, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid organizer id to approve organizer, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/disapprove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid).lean();
                if(organizerData && organizerData.mobileverified == true){
                    if(organizerData.status == true){
                        await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, {status : false});
                        return responseManager.onSuccess('Organizer disapproved sucecssfully!', 1, res);
                    }else{
                        return responseManager.badrequest({ message: 'Organizer is already disapproved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Organizer mobile number is not verified yet, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid organizer id to approve organizer, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndRemove(organizerid);
                await primary.model(constants.MODELS.events, eventModel).deleteMany({createdBy : mongoose.Types.ObjectId(organizerid)});
                return responseManager.onSuccess('Organizer removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid organizer id to remove organizer, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid);
                return responseManager.onSuccess('Organizer data !', organizerData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid organizer id to get organizer data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get organizer data, please try again' }, res);
    }
});
module.exports = router;