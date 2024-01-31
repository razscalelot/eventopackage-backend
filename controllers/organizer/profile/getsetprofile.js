const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.getprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            organizerData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Organizer profile!', organizerData, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get organizer profile, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get organizer profile, please try again' }, res);
    }
};
exports.setprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, dob, city, pincode, state, country, address, about, flat_no, street, area } = req.body;
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            let obj = {
                name: name,
                address: address,
                dob: dob,
                country: country,
                about: about,
                flat_no : flat_no,
                street : street,
                area : area,
                city: city,
                state: state,
                pincode: pincode,
                updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
            };
            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, obj);
            let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
            organizerData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Organizer profile updated successfully!', organizerData, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to set organizer profile, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update organizer profile, please try again' }, res);
    }
};