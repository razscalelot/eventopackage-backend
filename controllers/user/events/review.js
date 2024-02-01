const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const userModel = require('../../../models/users.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const mongoose = require('mongoose');
exports.review = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventid, ratings, review } = req.body;
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let existingreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({eventid : mongoose.Types.ObjectId(eventid), userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
                if(existingreview == null){
                    if(!isNaN(ratings) && review && review.trim() != ''){
                        let obj = {
                            eventid : mongoose.Types.ObjectId(eventid),
                            userid : mongoose.Types.ObjectId(req.token.userid),
                            ratings : parseFloat(ratings),
                            review : review,
                            timestamp : Date.now()
                        };
                        await primary.model(constants.MODELS.eventreviews, eventreviewModel).create(obj);
                        return responseManager.onSuccess("Event review placed successfully!", 1, res);
                    }else{
                        return responseManager.badrequest({ message: 'Invalid data to place review for the event, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Review already register for the event, please try again with other event' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid event id to rate event data, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid user id to rate event data, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to rate event data, please try again' }, res);
    }
};