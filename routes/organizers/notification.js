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
const selectusertypeCtrl = require("../../controllers/organizer/notifications/selectusertype");
const selectusersCtrl = require("../../controllers/organizer/notifications/selectusers");
const setscheduleCtrl = require("../../controllers/organizer/notifications/setschedule");
const importCtrl = require("../../controllers/organizer/notifications/import");
const userlistCtrl = require("../../controllers/organizer/notifications/userlist");
const checkalluserCtrl = require("../../controllers/organizer/notifications/checkallusers");
const checkuserCtrl = require("../../controllers/organizer/notifications/checkuser");
const settingCtrl = require("../../controllers/organizer/notifications/setting");
const paymentCtrl = require("../../controllers/organizer/notifications/payment");
router.post('/', helper.authenticateToken, listCtrl.list);
router.post('/save', helper.authenticateToken, saveCtrl.save);
router.post('/getone', helper.authenticateToken, getOneCtrl.getone);
router.post('/selectusertype', helper.authenticateToken, selectusertypeCtrl.selectusertype);
router.post('/selectusers', helper.authenticateToken, selectusersCtrl.selectusers);
router.post('/setschedule', helper.authenticateToken, setscheduleCtrl.setschedule);
router.post('/import', helper.authenticateToken, fileHelper.memoryUpload.single('file'), importCtrl.import);
router.post('/userlist', helper.authenticateToken, userlistCtrl.userlist);
router.post('/checkalluser', helper.authenticateToken, checkalluserCtrl.checkalluser);
router.post('/checkuser', helper.authenticateToken, checkuserCtrl.checkuser);
router.get('/setting', helper.authenticateToken, settingCtrl.getsettings);
router.post('/paynow', helper.authenticateToken, paymentCtrl.paynow);
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                    if (filesizeinMb <= 10) {
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
                        return responseManager.badrequest({ message: 'Banner file must be <= 10 MB, please try again' }, res);
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