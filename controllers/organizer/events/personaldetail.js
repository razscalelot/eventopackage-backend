const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.personaldetail = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let maineventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (maineventData && maineventData.iseditable == true) {
                    if (req.body.full_name && req.body.full_name.trim() != '' && req.body.mobile && req.body.mobile.trim() != '' && req.body.mobile.trim().length == 10 && req.body.email && req.body.email.trim() != '' && req.body.city && req.body.city.trim() != '' && req.body.state && req.body.state.trim() != '' && req.body.pincode && req.body.pincode.trim() != '') {
                        if (req.body.price_type == 'per_event') {
                            if (req.body.max_day && req.body.max_day != '') {
                                if ((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email))) {
                                    let obj = {
                                        professional_skill: (req.body.professional_skill) ? req.body.professional_skill : '',
                                        full_name: (req.body.full_name) ? req.body.full_name : '',
                                        country_code: (req.body.country_code) ? req.body.country_code : '',
                                        mobile: (req.body.mobile) ? req.body.mobile : '',
                                        is_mobile_hidden: (req.body.is_mobile_hidden) ? req.body.is_mobile_hidden : false,
                                        alt_mobile_no: (req.body.alt_mobile_no) ? req.body.alt_mobile_no : '',
                                        alt_mobile_hidden: (req.body.alt_mobile_hidden) ? req.body.alt_mobile_hidden : '',
                                        email: (req.body.email) ? req.body.email : '',
                                        is_email_hidden: (req.body.is_email_hidden) ? req.body.is_email_hidden : false,
                                        banner: (req.body.banner) ? req.body.banner : '',
                                        price: (req.body.price) ? req.body.price : '',
                                        price_type: (req.body.price_type) ? req.body.price_type : '',
                                        max_day: (req.body.max_day) ? req.body.max_day : '',
                                        clearing_time: (req.body.clearing_time) ? req.body.clearing_time : '',
                                        flat_no: (req.body.flat_no) ? req.body.flat_no : '',
                                        street: (req.body.street) ? req.body.street : '',
                                        area: (req.body.area) ? req.body.area : '',
                                        city: (req.body.city) ? req.body.city : '',
                                        state: (req.body.state) ? req.body.state : '',
                                        pincode: (req.body.pincode) ? req.body.pincode : '',
                                        country_wise_contact : (req.body.country_wise_contact) ? req.body.country_wise_contact : {},
                                        alt_country_wise_contact : (req.body.alt_country_wise_contact) ? req.body.alt_country_wise_contact : {}
                                    };
                                    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                                    await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), personaldetail: obj });
                                    let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                                    return responseManager.onSuccess('Organizer event personal data updated successfully!', eventData, res);
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid email id, please try again' }, res);
                                }
                            } else {
                                return responseManager.badrequest({ message: 'Invalid personal details max day can not be empty, please try again' }, res);
                            }
                        } else {
                            if ((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email))) {
                                let obj = {
                                    professional_skill: (req.body.professional_skill) ? req.body.professional_skill : '',
                                    full_name: (req.body.full_name) ? req.body.full_name : '',
                                    country_code: (req.body.country_code) ? req.body.country_code : '',
                                    mobile: (req.body.mobile) ? req.body.mobile : '',
                                    isocode: (req.body.isocode) ? req.body.isocode.trim() : '',
                                    is_mobile_hidden: (req.body.is_mobile_hidden) ? req.body.is_mobile_hidden : false,
                                    alt_mobile_no: (req.body.alt_mobile_no) ? req.body.alt_mobile_no : '',
                                    alt_mobile_hidden: (req.body.alt_mobile_hidden) ? req.body.alt_mobile_hidden : '',
                                    email: (req.body.email) ? req.body.email : '',
                                    is_email_hidden: (req.body.is_email_hidden) ? req.body.is_email_hidden : false,
                                    banner: (req.body.banner) ? req.body.banner : '',
                                    price: (req.body.price) ? req.body.price : '',
                                    price_type: (req.body.price_type) ? req.body.price_type : '',
                                    max_day: null,
                                    clearing_time: (req.body.clearing_time) ? req.body.clearing_time : '',
                                    flat_no: (req.body.flat_no) ? req.body.flat_no : '',
                                    street: (req.body.street) ? req.body.street : '',
                                    area: (req.body.area) ? req.body.area : '',
                                    city: (req.body.city) ? req.body.city : '',
                                    state: (req.body.state) ? req.body.state : '',
                                    pincode: (req.body.pincode) ? req.body.pincode : '',
                                    country_wise_contact : (req.body.country_wise_contact) ? req.body.country_wise_contact : {},
                                    alt_country_wise_contact : (req.body.alt_country_wise_contact) ? req.body.alt_country_wise_contact : {}
                                };
                                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                                await primary.model(constants.MODELS.events, eventModel).findByIdAndUpdate(eventid, { updatedBy: mongoose.Types.ObjectId(req.token.organizerid), personaldetail: obj });
                                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                                return responseManager.onSuccess('Organizer event personal data updated successfully!', eventData, res);
                            } else {
                                return responseManager.badrequest({ message: 'Invalid email id, please try again' }, res);
                            }
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid personal details full name, mobile no, email, city, state, price, clearing time and pincode can not be empty, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Event data can not be updated as event booking started..., Please contact admin to update event data' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id to add event personal data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update event personal data, please try again' }, res);
    }
};
exports.getpersonaldetail = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { eventid } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid);
                if (eventData && eventData != null) {
                    return responseManager.onSuccess('Organizer event data!', { _id: eventData._id, personaldetail: eventData.personaldetail }, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};