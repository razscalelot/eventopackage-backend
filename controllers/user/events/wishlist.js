const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const wishlistModel = require('../../../models/eventwishlists.model');
const mongoose = require('mongoose');
exports.wishlist = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventid } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let existingwishlist = await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOne({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                if (existingwishlist == null) {
                    let obj = {
                        eventid: mongoose.Types.ObjectId(eventid),
                        userid: mongoose.Types.ObjectId(req.token.userid),
                    };
                    await primary.model(constants.MODELS.eventwishlists, wishlistModel).create(obj);
                    return responseManager.onSuccess("Event wishlist placed successfully!", 1, res);
                } else {
                    await primary.model(constants.MODELS.eventwishlists, wishlistModel).findOneAndRemove({ eventid: mongoose.Types.ObjectId(eventid), userid: mongoose.Types.ObjectId(req.token.userid) }).lean();
                    return responseManager.onSuccess("Event wishlist remove successfully!", 1, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid event id placed to wishlist event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid event id placed to wishlist event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid user id placed to wishlist event data, please try again' }, res);
    }
};