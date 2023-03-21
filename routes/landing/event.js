let express = require("express");
let router = express.Router();
const eventModel = require('../../models/events.model');
const serviceModel = require('../../models/service.model');
const itemModel = require('../../models/items.model');
const equipmentModel = require('../../models/equipments.model');
const eventreviewModel = require('../../models/eventreviews.model');
const userModel = require('../../models/users.model');
const eventbookingModel = require('../../models/eventbookings.model');
const responseManager = require('../../utilities/response.manager');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const categoryModel = require('../../models/categories.model');
const mongoose = require('mongoose');
const async = require('async');
router.get('/list', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    await primary.model(constants.MODELS.events, eventModel).find({ is_approved: true, is_live: true, status: true }).populate({
        path: 'event_category',
        model: primary.model(constants.MODELS.categories, categoryModel),
        select: "category_name description event_type"
    }).select('display_name event_type event_category timestamp status createdAt updatedAt capacity aboutplace personaldetail discounts is_live is_approved').lean().then((events) => {
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
                    // allEvents.push(event);
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
            return responseManager.onSuccess("event List", allEvents, res);
        });
    }).catch((error) => {
        return responseManager.onError(error, res);
    });
});
router.get('/getone', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    const { eventid } = req.query;
    if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
        let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).populate([
            { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name description event_type" },
            { path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
            { path: "services", model: primary.model(constants.MODELS.services, serviceModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
            { path: "items", model: primary.model(constants.MODELS.items, itemModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' },
            { path: "equipments", model: primary.model(constants.MODELS.equipments, equipmentModel), select: '-createdAt -updatedAt -__v -createdBy -updatedBy -status' }
        ]).lean();
        if (eventData && eventData != null) {
            let totalPrice = 0;
            async.forEach(eventData.discounts, (discount, next_discount) => {
                if (discount.discounttype === "discount_on_total_bill") {
                    if (eventData.aboutplace) {
                        let getPrice = parseInt(eventData.aboutplace.place_price) - (parseInt(eventData.aboutplace.place_price) * parseInt(discount.discount) / 100);
                        totalPrice += getPrice;
                    } else if (eventData.personaldetail) {
                        let getPrice = parseInt(eventData.personaldetail.price) - (parseInt(eventData.personaldetail.price) * parseInt(discount.discount) / 100);
                        totalPrice += getPrice;
                    }
                }
                next_discount();
            }, () => {
                if (totalPrice == 0) {
                    if (eventData.aboutplace) {
                        totalPrice = parseFloat(eventData.aboutplace.place_price);
                    } else if (eventData.personaldetail) {
                        totalPrice = parseFloat(eventData.personaldetail.price);
                    }
                }
                eventData.totalPrice = parseFloat(totalPrice).toFixed(2);
            });
            let allreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).find({ eventid: mongoose.Types.ObjectId(eventid) }).populate({ path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name profile_pic" }).lean();
            eventData.reviews = allreview;
            return responseManager.onSuccess('Organizer event data!', eventData, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid event id to get event data, please try again' }, res);
    }
});
module.exports = router;