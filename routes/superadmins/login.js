let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const superadminModel = require('../../models/superadmins.model');
router.post('/', async (req, res, next) => {
    const { adminid, password } = req.body;
    if(adminid && password && adminid.length == 7 && password.length >= 6){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadminData = await primary.model(constants.MODELS.superadmins, superadminModel).findOne({adminid: adminid, status: true}).lean();
        if(superadminData && superadminData != null && superadminData.status == true){
            let decPassword = await helper.passwordDecryptor(superadminData.password);
            if(decPassword == password){
                let accessToken = await helper.generateAccessToken({ superadminid : superadminData._id.toString() });
                return responseManager.onSuccess('Super Admin login successfully!', {token : accessToken}, res);
            }else{
                return responseManager.badrequest({message : 'Invalid password, please try again'}, res);
            }
        }else{
            return responseManager.badrequest({message : 'Invalid admin user id or password please try again'}, res);
        }
    }else{
        return responseManager.badrequest({message : 'Invalid admin user id or password please try again'}, res);
    } 
});
module.exports = router;
