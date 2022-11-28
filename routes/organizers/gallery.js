let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
const mongoose = require('mongoose');
router.get('/', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        const { gallery } = req.query;
        if (gallery == 'all'){
            primary.model(constants.MODELS.events, eventModel).find({ createdBy: mongoose.Types.ObjectId(req.token.organizerid) }).select('-_id photos videos').lean().then((gallery) => {
                return responseManager.onSuccess('Gallery list!', gallery, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{            
            primary.model(constants.MODELS.events, eventModel).find({ createdBy: mongoose.Types.ObjectId(req.token.organizerid) }).select(`-_id ${gallery}`).lean().then((gallery) => {
                return responseManager.onSuccess('Gallery list!', gallery, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }   
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get gallery data please try again' }, res);
    }
});
module.exports = router;