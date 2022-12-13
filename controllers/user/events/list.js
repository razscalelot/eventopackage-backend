const eventModel = require('../../../models/events.model');
const userModel = require('../../../models/users.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { event_type, search } = req.body;
            primary.model(constants.MODELS.events, eventModel).find({
                status: true,
                $or: [
                    { name: { '$regex': new RegExp(search, "i") } },
                    { "createdBy.name": { '$regex': new RegExp(search, "i") } },
                    { "event_category.category_name": { '$regex': new RegExp(search, "i") } },
                    { "services.name": { '$regex': new RegExp(search, "i") } },
                    { "capacity.address": { '$regex': new RegExp(search, "i") } }
                ],
                $or: [
                    { event_type: { '$regex': new RegExp(event_type, "i") } },
                ],
            }).select("-services -photos -videos -othercost -companydetail -tandc -equipments -discounts -updatedBy -__v").populate([
                {path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name"},
                {path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel), select: "name profile_pic"}
            ]).lean().then((result) => {
                return responseManager.onSuccess("event List", result, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });

        } else {
            return responseManager.badrequest({ message: 'Invalid user request to find events near by you, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to find events near by you, please try again' }, res);
    }

















    // if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
    //     let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    //     let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
    //     if (userData && userData.status == true && userData.mobileverified == true) {
    //         const { page, limit, search, event_type, person_capacity, price } = req.body;
    //         await primary.model(constants.MODELS.events, eventModel).paginate({
    //             $or: [
    //                 { display_name: { '$regex': new RegExp(search, "i") } },
    //                 { category_name: { '$regex': new RegExp(search, "i") } },
    //                 { name: { '$regex': new RegExp(search, "i") } },

    //                 { name: { '$regex': new RegExp(search, "i") } },
    //                 //                     { event_type: { '$regex': new RegExp(search, "i") } },
    //                 //                     { other: { '$regex': new RegExp(search, "i") } },
    //                 //                     { "about.about_event": { '$regex': new RegExp(search, "i") } },
    //                 //                     { "event_location.flat_no": { '$regex': new RegExp(search, "i") } },
    //                 //                     { "event_location.street_name": { '$regex': new RegExp(search, "i") } },
    //                 //                     { "event_location.area_name": { '$regex': new RegExp(search, "i") } },
    //                 //                     { "event_location.location_address": { '$regex': new RegExp(search, "i") } },
    //                 //                     { "event_location.address": { '$regex': new RegExp(search, "i") } },
    //                 //                     { "event_location.city": { '$regex': new RegExp(search, "i") } },
    //                 //                     { "event_location.state": { '$regex': new RegExp(search, "i") } },
    //                 //                     { "event_location.pincode": { '$regex': new RegExp(search, "i") } }
    //             ],
    //             $or: [
    //                 { event_type: { '$regex': new RegExp(event_type, "i") } },
    //             ],
    //         }, {
    //             page,
    //             limit: parseInt(limit),
    //             sort: { _id: -1 },
    //             populate: { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type" },
    //             populate: { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel), select: "name profile_pic" },
    //             select: 'display_name event_type event_category timestamp status createdAt updatedAt capacity aboutplace personaldetail',
    //             lean: true
    //         }).then((events) => {
    //             return responseManager.onSuccess('Events list!', events, res);
    //         }).catch((error) => {
    //             return responseManager.onError(error, res);
    //         });
    //     } else {
    //         return responseManager.badrequest({ message: 'Invalid userid to get event list, please try again' }, res);
    //     }
    // } else {
    //     return responseManager.badrequest({ message: 'Invalid token to get event list, please try again' }, res);
    // }
};



// if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
//     let primary = mongoConnection.useDb(constants.DEFAULT_DB);
//     let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
//     if (userdata && userdata.status == true && userdata.mobileverified == true) {
//         const { latitude, longitude, search } = req.body;
//         if (latitude && longitude && latitude != '' && longitude != '' && latitude != null && longitude != null && validateLatLng(parseFloat(latitude), parseFloat(longitude))) {
//             let query = {
//                 "event_location.location": {
//                     $geoWithin: {
//                         $centerSphere: [
//                             [
//                                 parseFloat(longitude), parseFloat(latitude)
//                             ],
//                             (parseInt(100) * 0.62137119) / 3963.2
//                         ]
//                     }
//                 }
//             };
//             primary.model(constants.MODELS.events, eventModel).find({
//                 status: true,
//                 $or: [
//                     { name: { '$regex': new RegExp(search, "i") } },
//                     { event_type: { '$regex': new RegExp(search, "i") } },
//                     { other: { '$regex': new RegExp(search, "i") } },
//                     { "about.about_event": { '$regex': new RegExp(search, "i") } },
//                     { "event_location.flat_no": { '$regex': new RegExp(search, "i") } },
//                     { "event_location.street_name": { '$regex': new RegExp(search, "i") } },
//                     { "event_location.area_name": { '$regex': new RegExp(search, "i") } },
//                     { "event_location.location_address": { '$regex': new RegExp(search, "i") } },
//                     { "event_location.address": { '$regex': new RegExp(search, "i") } },
//                     { "event_location.city": { '$regex': new RegExp(search, "i") } },
//                     { "event_location.state": { '$regex': new RegExp(search, "i") } },
//                     { "event_location.pincode": { '$regex': new RegExp(search, "i") } }
//                 ],
//                 ...query
//             }).populate({
//                 path : 'createdBy',
//                 model : primary.model(constants.MODELS.organizers, organizerModel)
//             }).lean().then((result) => {
//                 return responseManager.onSuccess("event List", result, res);
//             }).catch((error) => {
//                 return responseManager.onError(error, res);
//             });
//         }else{
//             return responseManager.badrequest({ message: 'Invalid latitude and logitude to find events near by you, please try again' }, res);
//         }
//     }else{
//         return responseManager.badrequest({ message: 'Invalid user request to find events near by you, please try again' }, res);
//     }
// }else{
//     return responseManager.badrequest({ message: 'Invalid token to find events near by you, please try again' }, res);
// }