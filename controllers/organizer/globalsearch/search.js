const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const mongoose = require('mongoose');
const async = require('async');
exports.globalsearch = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { search } = req.body;
            await primary.model(constants.MODELS.events, eventModel).find({
                $or: [
                    { display_name: { '$regex': new RegExp(search, "i") } },
                    { event_type: { '$regex': new RegExp(search, "i") } },
                    { "aboutplace.place_price": { '$regex': new RegExp(search, "i") } },
                    { "aboutplace.price_type": { '$regex': new RegExp(search, "i") } },
                    { "aboutplace.max_day": { '$regex': new RegExp(search, "i") } },
                    { "aboutplace.person_capacity": { '$regex': new RegExp(search, "i") } },
                    { "capacity.flat_no": { '$regex': new RegExp(search, "i") } },
                    { "capacity.street_name": { '$regex': new RegExp(search, "i") } },
                    { "capacity.area_name": { '$regex': new RegExp(search, "i") } },
                    { "capacity.city": { '$regex': new RegExp(search, "i") } },
                    { "capacity.state": { '$regex': new RegExp(search, "i") } },
                    { "capacity.pincode": { '$regex': new RegExp(search, "i") } },
                    { "capacity.address": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.professional_skill": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.full_name": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.mobile": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.email": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.flat_no": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.street": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.area": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.city": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.state": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.pincode": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.name": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.mobile": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.email": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.about": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.flat_no": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.street": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.area": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.city": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.state": { '$regex': new RegExp(search, "i") } },
                    { "companydetail.pincode": { '$regex': new RegExp(search, "i") } },
                ],
                createdBy: mongoose.Types.ObjectId(req.token.organizerid)
            }).populate({ path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type" }).select('display_name event_type event_category timestamp status createdAt updatedAt capacity aboutplace personaldetail discounts is_live is_approved').lean()
                .then((events) => {
                    let allEvents = [];
                    async.forEachSeries(events, (event, next_event) => {
                        let totalPrice = 0;
                        (async () => {
                            let noofreview = parseInt(await primary.model(constants.MODELS.eventreviews, eventreviewModel).countDocuments({ eventid: mongoose.Types.ObjectId(event._id) }));
                            async.forEach(event.discounts, (discount, next_discount) => {
                                if (discount.discounttype === "discount_on_total_bill") {
                                    if (event.aboutplace) {
                                        let getPrice = parseInt(event.aboutplace.place_price) - (parseInt(event.aboutplace.place_price) * parseInt(discount.discount) / 100);
                                        totalPrice += getPrice;
                                    } else if (event.personaldetail) {
                                        let getPrice = parseInt(event.personaldetail.price) - (parseInt(event.personaldetail.price) * parseInt(discount.discount) / 100);
                                        totalPrice += getPrice;
                                    }
                                }
                                next_discount();
                            }, () => {
                                if (totalPrice == 0) {
                                    if (event.aboutplace) {
                                        totalPrice = parseFloat(event.aboutplace.place_price);
                                    } else if (event.personaldetail) {
                                        totalPrice = parseFloat(event.personaldetail.price);
                                    }
                                }
                                event.totalPrice = parseFloat(totalPrice).toFixed(2);
                                (async () => {
                                    if (noofreview > 0) {
                                        let totalReviewsCountObj = await primary.model(constants.MODELS.eventreviews, eventreviewModel).aggregate([{ $match: { eventid: mongoose.Types.ObjectId(event._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                                        if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                            event.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                            event.totalreview = noofreview;
                                            allEvents.push(event);
                                        }
                                    } else {
                                        event.ratings = '0.0';
                                        event.totalreview = 0;
                                        allEvents.push(event);
                                    }
                                    next_event();
                                })().catch((error) => { })
                            });
                        })().catch((error) => { })
                    }, () => {
                        return responseManager.onSuccess("Search List", allEvents, res);
                    });
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get search list, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get search list, please try again' }, res);
    }
};