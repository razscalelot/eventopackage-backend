var express = require('express');
var router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
const listCtrl = require("../../controllers/organizer/notifications/list");
const saveCtrl = require("../../controllers/organizer/notifications/save");
const getOneCtrl = require("../../controllers/organizer/notifications/getone");
router.post('/', helper.authenticateToken, listCtrl.list);
router.post('/save', helper.authenticateToken, saveCtrl.save);
router.post('/getone', helper.authenticateToken, getOneCtrl.getone);
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= parseInt(process.env.ALLOWED_BANNER_UPLOAD_SIZE)) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'notification').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    } else {
                        return responseManager.badrequest({ message: 'Banner file must be <= '+process.env.ALLOWED_BANNER_UPLOAD_SIZE+' MB, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to upload shop banner, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to upload shop banner, please try again' }, res);
    }
});
module.exports = router;