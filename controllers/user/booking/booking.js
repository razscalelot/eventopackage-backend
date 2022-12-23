const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const async = require("async");
const mongoose = require('mongoose');
exports.booking = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { user, eventId, trans_Id, name, address, payment_status, selectedItems, selectedEquipments, selectedServices, totalPrice, start_date, end_date, start_time, end_time } = req.body;
            if (user && user != '' && mongoose.Types.ObjectId.isValid(user) && eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                console.log("date", start_date);
                if(start_date && end_date && start_time && end_time){
                    let finalItems = [];
                    let finalEquipments = [];
                    let finalServices = [];
                    async.forEachSeries(selectedItems, (item, next_item) => {
                        if (item._id && item._id != '' && mongoose.Types.ObjectId.isValid(item._id)) {
                            item._id = mongoose.Types.ObjectId(item._id);
                            finalItems.push(item);
                        }
                        next_item();
                    }, () => {
                        async.forEachSeries(selectedEquipments, (equipment, next_equipment) => {
                            if (equipment._id && equipment._id != '' && mongoose.Types.ObjectId.isValid(equipment._id)) {
                                equipment._id = mongoose.Types.ObjectId(equipment._id);
                                finalEquipments.push(equipment);
                            }
                            next_equipment();
                        }, () => {
                            async.forEachSeries(selectedServices, (service, next_service) => {
                                if (service._id && service._id != '' && mongoose.Types.ObjectId.isValid(service._id)) {
                                    service._id = mongoose.Types.ObjectId(service._id);
                                    finalServices.push(service);
                                }
                                next_service();
                            }, () => {
                                (async () => {
                                    let xstart_date = start_date.split("-");
                                    let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + start_time).getTime();
                                    let yend_date = end_date.split("-");
                                    let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + end_time).getTime();
                                    let obj = {
                                        userid: mongoose.Types.ObjectId(user),
                                        eventId: mongoose.Types.ObjectId(eventId),
                                        trans_Id: trans_Id,
                                        name: name,
                                        address: address,
                                        payment_status: payment_status,
                                        selectedItems: finalItems,
                                        selectedEquipments: finalEquipments,
                                        selectedServices: finalServices,
                                        totalPrice: parseFloat(totalPrice),
                                        start_date: start_date,
                                        end_date: end_date,
                                        start_time: start_time,
                                        end_time: end_time,
                                        start_timestamp: startTimestamp,
                                        end_timestamp: endTimestamp
                                    };
                                    let output = await primary.model(constants.MODELS.eventbookings, eventbookingModel).create(obj);
                                    return responseManager.onSuccess('Event Book successfully!', output, res);
                                })().catch((error) => { 
                                    return responseManager.onError(error, res);
                                });
                            });
                        });
                    });
                }else{
                    return responseManager.badrequest({ message: 'Invalid start or end date time to book event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid user id or event id to book event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid user id to book event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to book event data, please try again' }, res);
    }
};
exports.checkavailability = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventId, start_date, end_date, start_time, end_time } = req.body;
            if (eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                if(start_date && end_date && start_time && end_time){
                    let xstart_date = start_date.split("-");
                    let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + start_time).getTime();
                    let yend_date = end_date.split("-");
                    let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + end_time).getTime();    
                    let existingData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({eventId : mongoose.Types.ObjectId(eventId)}).lean();
                    if(existingData && existingData.length > 0){
                        async.forEachSeries(existingData, (booking, next_booking) => {

                            next_booking();
                        });
                    }else{
                        return responseManager.onSuccess('Booking are available.', 1, res);
                    }
                    //, $or : [{ $and : [{start_timestamp : { $gte : startTimestamp}}, {end_timestamp : { $lte : startTimestamp}}] }, { $and : [{start_timestamp : { $gte : endTimestamp}}, {end_timestamp : { $lte : endTimestamp}}] }]}
                    console.log("existingData", existingData);
                    console.log('startTimestamp', startTimestamp);
                    console.log('endTimestamp', endTimestamp);
                    if(existingData && existingData.length > 0){
                        return responseManager.badrequest({ message: 'Booking are not available., please try again' }, res);                        
                    }else{
                        return responseManager.onSuccess('Booking are available.', 1, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid start or end date time to check event booking availability, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to check event booking availability, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid user data to check event booking availability, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
    }
};