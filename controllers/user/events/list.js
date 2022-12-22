const eventModel = require('../../../models/events.model');
const userModel = require('../../../models/users.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const categoryModel = require('../../../models/categories.model');
const organizerModel = require('../../../models/organizers.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const wishlistModel = require('../../../models/eventwishlists.model');
const async = require('async');
const mongoose = require('mongoose');
exports.list = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { event_type, price, min_person, max_person, search } = req.body;
            primary.model(constants.MODELS.events, eventModel).find({
                status: true,
                $or: [
                    { display_name: { '$regex': new RegExp(search, "i") } },
                    { event_type: { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.city": { '$regex': new RegExp(search, "i") } },
                    { "personaldetail.state": { '$regex': new RegExp(search, "i") } },
                    { "capacity.address": { '$regex': new RegExp(search, "i") } },
                    { totalPrice: { '$regex': new RegExp(price, "i") } },

                    { "event_category.category_name": { '$regex': new RegExp(search, "i") } },
                    { "services.name": { '$regex': new RegExp(search, "i") } },
                    { "items.name": { '$regex': new RegExp(search, "i") } },
                    { "equipments.name": { '$regex': new RegExp(search, "i") } },
                    { "createdBy.name": { '$regex': new RegExp(search, "i") } },
                ],
                $and: [
                    { event_type: { '$regex': new RegExp(event_type, "i") } },
                ],
            }).select('event_category createdBy display_name event_type timestamp status createdAt updatedAt aboutplace personaldetail capacity discounts').populate([
                { path: 'event_category', model: primary.model(constants.MODELS.categories, categoryModel), select: "category_name" },
                { path: 'createdBy', model: primary.model(constants.MODELS.organizers, organizerModel), select: "name profile_pic" }
            ]).lean().then((result) => {
                let allEvents = [];
                async.forEachSeries(result, (event, next_event) => {
                    (async () => {
                        let noofreview = parseInt(await primary.model(constants.MODELS.eventreviews, eventreviewModel).countDocuments({ eventid: mongoose.Types.ObjectId(event._id) }));
                        let wishlist = await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOne({ eventid: mongoose.Types.ObjectId(event._id), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                        event.whishlist_status = (wishlist == null) ? false : true
                        let totalPrice = 0;
                        async.forEachSeries(event.discounts, (discount, next_discount) => {
                            if (discount.discounttype === "discount_on_total_bill") {
                                if (event.aboutplace){
                                    let getPrice = parseInt(event.aboutplace.place_price) - (parseInt(event.aboutplace.place_price) * parseInt(discount.discount) / 100);
                                    totalPrice += getPrice;
                                }else if(event.personaldetail){
                                    let getPrice = parseInt(event.personaldetail.price) - (parseInt(event.personaldetail.price) * parseInt(discount.discount) / 100);
                                    totalPrice += getPrice;
                                }
                            }
                            next_discount();
                        });
                        event.totalPrice = totalPrice
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
                    return responseManager.onSuccess("event List", allEvents, res);
                });
            }).catch((error) => {
                return responseManager.onError(error, res);
            });

        } else {
            return responseManager.badrequest({ message: 'Invalid user request to find events near by you, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to find events near by you, please try again' }, res);
    }
};

