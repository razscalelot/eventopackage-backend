let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const agentModel = require('../../models/agents.model');
let fileHelper = require('../../utilities/multer.functions');
const AwsCloud = require('../../utilities/aws');
const allowedContentTypes = require("../../utilities/content-types");
const mongoose = require('mongoose');
router.get('/', helper.authenticateToken, async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.agentid && mongoose.Types.ObjectId.isValid(req.token.agentid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let agentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
        if(agentData && agentData.status == true && agentData.mobileverified == true && agentData.is_approved == true){
            agentData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Agent profile!', agentData, res);
        }else{
            return responseManager.badrequest({ message: 'Invalid agentid to get agent profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get agent profile, please try again' }, res);
    }
});
router.post('/', helper.authenticateToken, async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, dob, flat_no, street, area, city, pincode, state, country, about } = req.body;
    if (req.token.agentid && mongoose.Types.ObjectId.isValid(req.token.agentid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let agentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
        if(agentData && agentData.status == true && agentData.mobileverified == true && agentData.is_approved == true){
            let obj = {
                name : name,
                dob : dob,
                flat_no : flat_no,
                street : street,
                area : area,
                city : city,
                pincode : pincode,
                state : state,
                country : country,
                about : about,
                updatedBy : mongoose.Types.ObjectId(req.token.agentid)
            };
            await primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(req.token.agentid, obj);
            let updatedagentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
            updatedagentData.s3Url = process.env.AWS_BUCKET_URI;
            return responseManager.onSuccess('Agent profile updated successfully!', updatedagentData, res);
        }else{
            return responseManager.badrequest({ message: 'Invalid agentid to set agent profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update agent profile, please try again' }, res);
    }
});
router.post('/profilepic', helper.authenticateToken, fileHelper.memoryUpload.single('file'), async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.agentid && mongoose.Types.ObjectId.isValid(req.token.agentid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let agentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
        if(agentData && agentData.status == true && agentData.mobileverified == true && agentData.is_approved == true){
            if (req.file) {
                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                    if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                        AwsCloud.saveToS3(req.file.buffer, req.token.agentid.toString(), req.file.mimetype, 'agentprofile').then((result) => {
                            let obj = {profile_pic : result.data.Key};
                            primary.model(constants.MODELS.agents, agentModel).findByIdAndUpdate(req.token.agentid, obj).then((updateResult) => {
                                ( async () => {
                                    let updatedagentData = await primary.model(constants.MODELS.agents, agentModel).findById(req.token.agentid).select('-password').lean();
                                    updatedagentData.s3Url = process.env.AWS_BUCKET_URI;
                                    return responseManager.onSuccess('Agent profile pic updated successfully!', updatedagentData, res);
                                })().catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            }).catch((error) => {
                                return responseManager.onError(error, res);
                            });
                        }).catch((error) => {
                            return responseManager.onError(error, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Image file must be <= '+process.env.ALLOWED_IMAGE_UPLOAD_SIZE+' MB for profile pic, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed for profile pic, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid file to update agent profile pic, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid agentid to set agent profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to update agent profile, please try again' }, res);
    }
});
module.exports = router;
