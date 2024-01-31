const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const organizerModel = require('../../../models/organizers.model');
exports.changeorganizerpassword = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { password, mobile } = req.body;
    if (password && password.trim() != '' && mobile && mobile.length == 10) {
        if (password.length >= 8) {
            let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findOne({ mobile: mobile }).lean();
            if (organizerData) {
                let ecnPassword = await helper.passwordEncryptor(password);
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerData._id, { password: ecnPassword });
                return responseManager.onSuccess('Organizer password changed successfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid organizer mobile number, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Make sure your password is of at least 8 characters long, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to change organizer password, please try again' }, res);
    }
};