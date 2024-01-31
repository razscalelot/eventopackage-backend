const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const agentModel = require('../../../models/agents.model');
exports.changeagentpassword = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { password, mobile } = req.body;
    if (password && password.trim() != '' && mobile && mobile.length == 10) {
        if ((/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,100}$/.test(password))) {
            let agentData = await primary.model(constants.MODELS.agents, agentModel).findOne({ mobile: mobile }).lean();
            if (agentData) {
                let ecnPassword = await helper.passwordEncryptor(password);
                await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(agentData._id, { password: ecnPassword });
                return responseManager.onSuccess('Agent password changed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid agent mobile number, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Make sure your password is of at least 8 characters long and must contain, 1 Upper case, 1 Lower case 1 Special character, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to change agent password, please try again' }, res);
    }
};