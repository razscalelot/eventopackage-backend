let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const superadminModel = require('../../models/superadmins.model');
const { default: mongoose } = require("mongoose");
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search, sortfield, sortoption } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            primary.model(constants.MODELS.users, userModel).paginate({
                $or: [
                    { name: { '$regex': new RegExp(search, "i") } },
                    { email: { '$regex': new RegExp(search, "i") } },
                    { mobile: { '$regex': new RegExp(search, "i") } },
                    { country_code: { '$regex': new RegExp(search, "i") } },
                    { refer_code: { '$regex': new RegExp(search, "i") } },
                    { my_refer_code: { '$regex': new RegExp(search, "i") } },
                    { about: { '$regex': new RegExp(search, "i") } }
                ]
            }, {
                page,
                limit: parseInt(limit),
                sort: { [sortfield]: [sortoption] },
                select: '-password',
                lean: true
            }).then((userList) => {
                return responseManager.onSuccess('users list!', userList, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get users list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { userid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (userid && userid != '' && mongoose.Types.ObjectId.isValid(userid)) {
                let userData = await primary.model(constants.MODELS.users, userModel).findById(userid).select('-password').lean();
                return responseManager.onSuccess('User data !', userData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid user id to get user data, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get user data, please try again' }, res);
    }
});
module.exports = router;