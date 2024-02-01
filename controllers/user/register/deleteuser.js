const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const mongoose = require('mongoose');
exports.deleteuser = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, { status: false });
            return responseManager.onSuccess('User deleted successfully!', 1, res);
        } else {
            return responseManager.onSuccess('Invalid User data to delete user, Please try again!', 0, res);
        }
    } else {
        return responseManager.onSuccess('Invalid User data to delete user, Please try again!', 0, res);
    }
};