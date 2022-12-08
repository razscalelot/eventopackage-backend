let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const promotionplanModel = require('../../models/promotionplans.model');
const organizerModel = require('../../models/organizers.model');
const mongoose = require('mongoose');
router.get('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            primary.model(constants.MODELS.promotionplans, promotionplanModel).find({ status: true }).lean().then((promotionplans) => {
                return responseManager.onSuccess('promotionplans list!', promotionplans, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get promotionplans list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true) {
            const { planid } = req.body;
            if (planid && planid != '' && mongoose.Types.ObjectId.isValid(planid)) {
                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                primary.model(constants.MODELS.promotionplans, promotionplanModel).findById(planid).lean().then((plan) => {
                    return responseManager.onSuccess('plan data!', plan, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            } else {
                return responseManager.unauthorisedRequest(res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get plan, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
});
module.exports = router;