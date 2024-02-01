const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const userModel = require('../../../models/users.model');
exports.changeuserpassword = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { password, mobile } = req.body;
    if (password && password.trim() != '' && password.length >= 8 && mobile && mobile.length == 10) {
        let userData = await primary.model(constants.MODELS.users, userModel).findOne({ mobile: mobile }).lean();
        if (userData) {
            let ecnPassword = await helper.passwordEncryptor(password);
            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userData._id, { password: ecnPassword });
            return responseManager.onSuccess('User password changed successfully!', 1, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid user mobile number, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to change user password, please try again' }, res);
    }
};