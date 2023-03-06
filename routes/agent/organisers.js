let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const agentModel = require('../../models/agents.model');
const organizerModel = require('../../models/organizers.model');
const mongoose = require('mongoose');
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.agentid && mongoose.Types.ObjectId.isValid(req.token.agentid)) {
        const { page, limit, search } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let agentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
        if (agentData && agentData.status == true && agentData.mobileverified == true && agentData.is_approved == true) {
            let organiserList = await primary.model(constants.MODELS.organizers, organizerModel).paginate({
                $or: [
                    { name: { '$regex': new RegExp(search, "i") } },
                    { email: { '$regex': new RegExp(search, "i") } },
                    { mobile: { '$regex': new RegExp(search, "i") } },
                    { country_code: { '$regex': new RegExp(search, "i") } },
                    { refer_code: { '$regex': new RegExp(search, "i") } }
                ],
                agentid : mongoose.Types.ObjectId(req.token.agentid)
            },{
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                select: 'name email mobile country_code refer_code my_refer_code status mobileverified last_login_at about city country dob pincode state profile_pic is_approved',
                lean: true
            });
            return responseManager.onSuccess('Organisers list!', organiserList, res);
        }else {
            return responseManager.badrequest({ message: 'Invalid agentid to get organiser list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;