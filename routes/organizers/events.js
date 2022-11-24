var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const eventModel = require('../../models/events.model');
const responseManager = require('../../utilities/response.manager');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const mongoose = require('mongoose');
const createCtrl = require('../../controllers/organizer/events/create');
const aboutPlaceCtrl = require('../../controllers/organizer/events/aboutplace');
const personaldetailCtrl = require('../../controllers/organizer/events/personaldetail');
const mediaCtrl = require('../../controllers/organizer/events/media');
const serviceCtrl = require('../../controllers/organizer/events/service');
const categoryCtrl = require('../../controllers/organizer/events/categories');
const capacityCtrl = require('../../controllers/organizer/events/capacity');
const companydetailCtrl = require('../../controllers/organizer/events/companydetail');
const tandcCtrl = require('../../controllers/organizer/events/tandc');
const discountCtrl = require('../../controllers/organizer/events/discount');
// post apis
router.post('/save', helper.authenticateToken, createCtrl.createevent);
router.post('/aboutplace', helper.authenticateToken, aboutPlaceCtrl.aboutplace);
router.post('/personaldetail', helper.authenticateToken, personaldetailCtrl.personaldetail);
router.post('/media', helper.authenticateToken, mediaCtrl.media);
router.post('/capacity', helper.authenticateToken, capacityCtrl.capacity);
router.post('/companydetail', helper.authenticateToken, companydetailCtrl.companydetail);
router.post('/tandc', helper.authenticateToken, tandcCtrl.tandc);
router.post('/discount', helper.authenticateToken, discountCtrl.discount);
// get apis
router.get('/', helper.authenticateToken, createCtrl.getevent);
router.get('/aboutplace', helper.authenticateToken, aboutPlaceCtrl.getaboutplace);
router.get('/personaldetail', helper.authenticateToken, personaldetailCtrl.getpersonaldetail);
router.get('/media', helper.authenticateToken, mediaCtrl.getmedia);
router.get('/capacity', helper.authenticateToken, capacityCtrl.getcapacity);
router.get('/companydetail', helper.authenticateToken, companydetailCtrl.getcompanydetail);
router.get('/tandc', helper.authenticateToken, tandcCtrl.gettandc);
router.get('/discount', helper.authenticateToken, discountCtrl.getdiscount);
// organizer wise category
router.post('/addcategory', helper.authenticateToken, categoryCtrl.addcategory);
router.post('/getonecategory', helper.authenticateToken, categoryCtrl.getonecategory);
router.post('/removecategory', helper.authenticateToken, categoryCtrl.removecategory);
router.get('/listcategory', helper.authenticateToken, categoryCtrl.listcategory);
// end organizer wise category
// organizer wise services
router.post('/addservice', helper.authenticateToken, serviceCtrl.addservice);
router.post('/getoneservice', helper.authenticateToken, serviceCtrl.getoneservice);
router.post('/removeservice', helper.authenticateToken, serviceCtrl.removeservice);
router.get('/listservice', helper.authenticateToken, serviceCtrl.listservice);
// end organizer wise services
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        if (req.file) {
            if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                if (filesizeinMb <= 3) {
                    AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                        let obj = {
                            s3_url: process.env.AWS_BUCKET_URI,
                            url: result.data.Key
                        };
                        return responseManager.onSuccess('File uploaded successfully!', obj, res);
                    }).catch((error) => {
                        return responseManager.onError(error, res);
                    });
                }else{
                    return responseManager.badrequest({ message: 'Image file must be <= 3 MB, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
router.post('/video', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        if (req.file) {
            if (allowedContentTypes.videoarray.includes(req.file.mimetype)) {
                let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                if (filesizeinMb <= 512) {
                    if(filesizeinMb > 25){
                        AwsCloud.saveToS3Multipart(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                            let obj = {
                                s3_url: process.env.AWS_BUCKET_URI,
                                url: result.data.Key
                            };
                            return responseManager.onSuccess('File uploaded successfully!', obj, res);
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }
                }else{
                    return responseManager.badrequest({ message: 'Video file must be <= 512 MB, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file type only video files allowed, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload video, please try again' }, res);
    }
});
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        if (req.file) {
            if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                if (filesizeinMb <= 10) {
                    AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                        let obj = {
                            s3_url: process.env.AWS_BUCKET_URI,
                            url: result.data.Key
                        };
                        return responseManager.onSuccess('File uploaded successfully!', obj, res);
                    }).catch((error) => {
                        return responseManager.onError(error, res);
                    });
                }else{
                    return responseManager.badrequest({ message: 'Banner file must be <= 10 MB, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload image, please try again' }, res);
    }
});
router.post('/document', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        if (req.file) {
            if (allowedContentTypes.docarray.includes(req.file.mimetype)) {
                let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1000000);
                if (filesizeinMb <= 25) {
                    AwsCloud.saveToS3(req.file.buffer, req.token.organizerid.toString(), req.file.mimetype, 'event').then((result) => {
                        let obj = {
                            s3_url: process.env.AWS_BUCKET_URI,
                            url: result.data.Key
                        };
                        return responseManager.onSuccess('File uploaded successfully!', obj, res);
                    }).catch((error) => {
                        return responseManager.onError(error, res);
                    });
                }else{
                    return responseManager.badrequest({ message: 'Document file must be <= 25 MB, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file type only document (PDF) files allowed, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to upload document, please try again' }, res);
    }
});
module.exports = router;