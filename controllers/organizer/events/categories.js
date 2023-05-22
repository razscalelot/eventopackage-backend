const categoryModel = require('../../../models/categories.model');
const organizerModel = require('../../../models/organizers.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
exports.addcategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { categoryid, category_name, event_type } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                if (category_name && category_name.trim() != '') {
                    let obj = {
                        category_name: category_name,
                        event_type: event_type,
                        status: true,
                        public: false,
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    await primary.model(constants.MODELS.categories, categoryModel).findByIdAndUpdate(categoryid, obj);
                    let categoryData = await primary.model(constants.MODELS.categories, categoryModel).findById(categoryid);
                    return responseManager.onSuccess('Organizer event category data updated successfully!', categoryData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid add category name can not be empty, please try again' }, res);
                }
            } else {
                if (category_name && category_name.trim() != '') {
                    let obj = {
                        category_name: category_name,                        
                        event_type: event_type,
                        status: true,
                        public: false,
                        createdBy: mongoose.Types.ObjectId(req.token.organizerid),
                        updatedBy: mongoose.Types.ObjectId(req.token.organizerid)
                    };
                    let categoryData = await primary.model(constants.MODELS.categories, categoryModel).create(obj);
                    return responseManager.onSuccess('Organizer event category created successfully!', categoryData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid add category name can not be empty, please try again' }, res);
                }
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to create event category data, please try again' }, res);
    }
};
exports.listcategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { event_type } = req.query;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            primary.model(constants.MODELS.categories, categoryModel).find({$and: [{$or: [{ createdBy: mongoose.Types.ObjectId(req.token.organizerid)},{ public: true }]}, { $or: [{ event_type: event_type}]}]}).sort({"category_name": -1}).lean().then((categories) => {
                return responseManager.onSuccess('Categories list!', categories, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get category data, please try again' }, res);
    }
};
exports.getonecategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { categoryid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                let categoryData = await primary.model(constants.MODELS.categories, categoryModel).findById(categoryid);
                return responseManager.onSuccess('Categories data !', categoryData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid category id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get category, please try again' }, res);
    }
};
exports.removecategory = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { categoryid } = req.body;
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            if (categoryid && categoryid != '' && mongoose.Types.ObjectId.isValid(categoryid)) {
                await primary.model(constants.MODELS.categories, categoryModel).findOneAndRemove(categoryid);
                return responseManager.onSuccess('Category removed sucecssfully!', 1, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid category id to get item data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to update event, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get category data, please try again' }, res);
    }
};