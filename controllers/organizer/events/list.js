const eventModel = require('../../../models/events.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const mongoose = require('mongoose');
const async = require('async');
exports.list = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { page, limit, search, event_type } = req.body;
            await primary.model(constants.MODELS.events, eventModel).paginate({
                $or: [
                    { display_name: { '$regex': new RegExp(search, "i") } },
                    { event_type: { '$regex': new RegExp(search, "i") } },
                ],
                $or: [
                    { event_type: { '$regex': new RegExp(event_type, "i") } },
                ],
                createdBy: mongoose.Types.ObjectId(req.token.organizerid)
            }, {
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                populate: { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type" },
                select: 'display_name event_type event_category timestamp status createdAt updatedAt capacity aboutplace personaldetail discounts is_live',
                lean: true
            }).then((events) => {
                let allEvents = [];
                async.forEachSeries(events.docs, (event, next_event) => {
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
                            allEvents.push(event);
                        });
                        if (noofreview > 0) {
                            let totalReviewsCountObj = await primary.model(constants.MODELS.eventreviews, eventreviewModel).aggregate([{ $match: { eventid: mongoose.Types.ObjectId(event._id) } }, { $group: { _id: null, sum: { $sum: "$ratings" } } }]);
                            if (totalReviewsCountObj && totalReviewsCountObj.length > 0 && totalReviewsCountObj[0].sum) {
                                event.ratings = parseFloat(parseFloat(totalReviewsCountObj[0].sum) / noofreview).toFixed(1);
                                allEvents.push(event);
                            }
                        } else {
                            event.ratings = '0.0';
                            allEvents.push(event);
                        }
                        next_event();
                    })().catch((error) => { })
                }, () => {
                    events.docs = allEvents;
                    return responseManager.onSuccess('Events list!', events, res);
                });
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event list, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event list, please try again' }, res);
    }
};