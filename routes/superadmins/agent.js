let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const agentModel = require('../../models/agents.model');
const superadminModel = require('../../models/superadmins.model');
const eventModel = require('../../models/events.model');
const { default: mongoose } = require("mongoose");
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search, sortfield, sortoption } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.agents, agentModel).paginate({
                $or: [
                    { name : { '$regex' : new RegExp(search, "i") } },
                    { email : { '$regex' : new RegExp(search, "i") } },
                    { mobile : { '$regex' : new RegExp(search, "i") } }
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { [sortfield] : [sortoption] },
                lean: true
            }).then((agentList) => {
                return responseManager.onSuccess('agent list!', agentList, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get agent list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { agentid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)){
                let agentData = await primary.model(constants.MODELS.agents, agentModel).findById(agentid);
                return responseManager.onSuccess('Agent data !', agentData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid agent id to get agent data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get agent data, please try again' }, res);
    }
});
router.post('/getorganiser', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { agentid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)){
                let organiserList = await primary.model(constants.MODELS.organizers, organizerModel).find({
                    agentid : mongoose.Types.ObjectId(agentid)
                }).lean();
                return responseManager.onSuccess('Organisers list!', organiserList, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid agent id to get organiser list, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get organiser list, please try again' }, res);
    }
});
module.exports = router;