const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const agentModel = require('../../../models/agents.model');
const mongoose = require('mongoose');
exports.getprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.agentid && mongoose.Types.ObjectId.isValid(req.token.agentid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let agentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
        if (agentData && agentData.status == true && agentData.mobileverified == true && agentData.is_approved == true) {
            agentData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Agent profile!', agentData, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid agentid to get agent profile, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get agent profile, please try again' }, res);
    }
};
exports.setprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, dob, flat_no, street, area, city, pincode, state, country, about } = req.body;
    if (req.token.agentid && mongoose.Types.ObjectId.isValid(req.token.agentid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let agentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
        if (agentData && agentData.status == true && agentData.mobileverified == true && agentData.is_approved == true) {
            let obj = {
                name: name,
                dob: dob,
                flat_no: flat_no,
                street: street,
                area: area,
                city: city,
                pincode: pincode,
                state: state,
                country: country,
                about: about,
                updatedBy: mongoose.Types.ObjectId(req.token.agentid)
            };
            await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(req.token.agentid, obj);
            let updatedagentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
            updatedagentData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Agent profile updated successfully!', updatedagentData, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid agentid to set agent profile, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update agent profile, please try again' }, res);
    }
};