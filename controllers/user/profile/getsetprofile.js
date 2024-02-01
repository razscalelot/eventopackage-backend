const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const mongoose = require('mongoose');
exports.getprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if(userData.name && userData.name.trim() != ''){
            userData.isProfileUpdated = true;
        }else{
            userData.isProfileUpdated = false;
        }
        userData.s3Url = process.env.AWS_BUCKET_URI;
        return responseManager.onSuccess('User profile!', userData, res);
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get user profile, please try again' }, res);
    }
};
exports.setprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, email, dob, city, pincode, state, country, about } = req.body;
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let obj = {
            name : name,
            email: email,
            dob : dob,
            city : city,
            pincode : pincode,
            state : state,
            country : country,
            about : about,
            updatedBy : mongoose.Types.ObjectId(req.token.userid)
        };
        await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, obj);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select('-password').lean();
        if(userData.name && userData.name.trim() != ''){
            userData.isProfileUpdated = true;
        }else{
            userData.isProfileUpdated = false;
        }
        userData.s3Url = process.env.AWS_BUCKET_URI;
        return responseManager.onSuccess('User profile updated successfully!', userData, res);
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update user profile, please try again' }, res);
    }
};