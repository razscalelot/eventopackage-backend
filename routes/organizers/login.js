let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
router.post('/', async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { phone_no, password } = req.body;
    if(phone_no && password && phone_no.length == 10 && password.length >= 6){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findOne({phone_no: phone_no, is_approved: true, status: true, mobileverified : true}).lean();
        if(organizerData && organizerData != null && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true){
            let decPassword = await helper.passwordDecryptor(organizerData.password);
            if(decPassword == password){
                let accessToken = await helper.generateAccessToken({ organizerid : organizerData._id.toString() });
                return responseManager.onSuccess('Organizer login successfully!', {token : accessToken}, res);
            }else{
                return responseManager.badrequest({message : 'Invalid password, please try again'}, res);
            }
        }else{
            return responseManager.badrequest({message : 'Invalid mobile or password please try again'}, res);
        }
    }else{
        return responseManager.badrequest({message : 'Invalid mobile or password please try again'}, res);
    } 
});
module.exports = router;
