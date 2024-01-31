const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.setbusinessprofile = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, email, mobile, country_code, address, dob, country, about, flat_no, street, area, city, country_wise_contact } = req.body;
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let existingData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).lean();
        if (existingData) {
            let obj = {
                profile_pic: (existingData.businessProfile && existingData.businessProfile.profile_pic && existingData.businessProfile.profile_pic != '') ? existingData.businessProfile.profile_pic : '',
                name: name,
                email: email,
                country_code : country_code,
                mobile: mobile,
                street : street,
                area : area,
                city : city,
                address: address,
                dob: dob,
                country: country,
                about: about,                
                country_wise_contact: (country_wise_contact) ? country_wise_contact : {}
            };
            await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(req.token.organizerid, { businessProfile: obj });
            let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
            organizerData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Organizer business profile updated successfully!', organizerData, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update organizer business profile, please try again' }, res);
    }
};