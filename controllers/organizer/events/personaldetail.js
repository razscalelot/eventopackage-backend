const eventModel = require('../../../models/events.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.personaldetail = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid } = req.body;
        if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
            if(req.body.full_name && req.body.full_name.trim() != '' && req.body.mobile_no && req.body.mobile_no.trim() != '' && req.body.mobile_no.trim().length == 10 && req.body.email && req.body.email.trim() != '' && req.body.city && req.body.city.trim() != '' && req.body.state && req.body.state.trim() != '' && req.body.pincode && req.body.pincode.trim() != ''){
                if((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email))){
                    let obj = {
                        professional_skill: (req.body.professional_skill) ? req.body.professional_skill : '',
                        full_name : (req.body.full_name) ? req.body.full_name : '', 
                        mobile_no: (req.body.mobile_no) ? req.body.mobile_no : '',
                        is_mobile_hidden: (req.body.is_mobile_hidden) ? req.body.is_mobile_hidden : false, 
                        alt_mobile_no: (req.body.alt_mobile_no) ? req.body.alt_mobile_no : '',
                        email: (req.body.email) ? req.body.email : '',
                        is_email_hidden: (req.body.is_email_hidden) ? req.body.is_email_hidden : false,
                        flat_no : (req.body.flat_no) ? req.body.flat_no : '',
                        street : (req.body.street) ? req.body.street : '', 
                        area : (req.body.area) ? req.body.area : '',  
                        city : (req.body.city) ? req.body.city : '',
                        state : (req.body.state) ? req.body.state : '',
                        pincode : (req.body.pincode) ? req.body.pincode : ''
                    };
                    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                    await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, {updatedBy : mongoose.Types.ObjectId(req.token.organizerid), personaldetail : obj});
                    let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                    return responseManager.onSuccess('Organizer event personal data updated successfully!', eventData, res);        
                }else{
                    return responseManager.badrequest({message : 'Invalid email id, please try again'}, res);
                }
            }else{
                return responseManager.badrequest({message : 'Invalid personal details full name, mobile no, email, city, state and pincode can not be empty, please try again'}, res);
            }
        }else{
            return responseManager.badrequest({message : 'Invalid event id to add event personal data, please try again'}, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update event personal data, please try again' }, res);
    }
};
exports.getpersonaldetail = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid } = req.query;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
            let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
            return responseManager.onSuccess('Organizer event data!', {_id : eventData._id, personaldetail : eventData.personaldetail}, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};