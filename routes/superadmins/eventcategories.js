let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const categoryModel = require('../../models/categories.model');
const superadminModel = require('../../models/superadmins.model');
const { default: mongoose } = require("mongoose");
router.post('/', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search, event_type, sortfield, sortoption } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            primary.model(constants.MODELS.categories, categoryModel).paginate({
                $or: [
                    { category_name: { '$regex': new RegExp(search, "i") } },
                ],
                $and: [
                    { event_type: { '$regex': new RegExp(event_type, "i") } },
                ]
            }, {
                page,
                limit: parseInt(limit),
                sort: { [sortfield]: [sortoption] },
                lean: true
            }).then((categories) => {
                return responseManager.onSuccess('Categories list!', categories, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get categories list, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { categoryid, category_name, event_type } = req.body;
        if (category_name && category_name.trim() != '' && event_type && event_type.trim() != '') {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
            if (superadmin) {
                if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                    let existingCategory = await primary.model(constants.MODELS.categories, categoryModel).findOne({ _id: { $ne: categoryid }, category_name: category_name }).lean();
                    if (existingCategory == null) {
                        let obj = {
                            category_name: category_name,
                            event_type: event_type,
                            status: true,
                            public: true,
                            updatedBy: mongoose.Types.ObjectId(req.token.superadminid)
                        };
                        await primary.model(constants.MODELS.categories, categoryModel).findByIdAndUpdate(categoryid, obj);
                        let updatedData = await  primary.model(constants.MODELS.categories, categoryModel).findById(categoryid).lean();
                        return responseManager.onSuccess('Category updated sucecssfully!', updatedData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Category name can not be identical, please try again' }, res);
                    }
                } else {
                    let existingCategory = await primary.model(constants.MODELS.categories, categoryModel).findOne({ category_name: category_name }).lean();
                    if (existingCategory == null) {
                        let obj = {
                            category_name: category_name,
                            event_type: event_type,
                            status: true,
                            public: true,
                            createdBy: mongoose.Types.ObjectId(req.token.superadminid),
                            updatedBy: mongoose.Types.ObjectId(req.token.superadminid)
                        };
                        let insertedData = await primary.model(constants.MODELS.categories, categoryModel).create(obj);
                        return responseManager.onSuccess('Category created sucecssfully!', insertedData, res);
                    } else {
                        return responseManager.badrequest({ message: 'Category name can not be identical, please try again' }, res);
                    }
                }
            } else {
                return responseManager.unauthorisedRequest(res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid event type for category, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to save category data, please try again' }, res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { categoryid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                await primary.model(constants.MODELS.categories, categoryModel).findByIdAndRemove(categoryid);
                return responseManager.onSuccess('Category removed sucecssfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid category id to remove category data, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to remove category data, please try again' }, res);
    }
});
router.post('/list', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        const { event_type } = req.query;
        if (superadmin) {
            primary.model(constants.MODELS.categories, categoryModel).find({ createdBy: mongoose.Types.ObjectId(req.token.superadminid), event_type: event_type }).sort({_id: -1}).then((categories) => {
                return responseManager.onSuccess('Categories list!', categories, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get categories list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { categoryid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                let categoryData = await primary.model(constants.MODELS.categories, categoryModel).findById(categoryid);
                return responseManager.onSuccess('Category data !', categoryData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid category id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get category data, please try again' }, res);
    }
});
module.exports = router;
