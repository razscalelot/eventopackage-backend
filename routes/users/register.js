let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const registerNewUserCtrl = require('../../controllers/user/register/register');
const verifyotpForUserCtrl = require('../../controllers/user/register/verifyotp');
const forgotUserPasswordCtrl = require('../../controllers/user/register/forgotpassword');
const changeUserPasswordCtrl = require('../../controllers/user/register/changepassword');
const deleteUserCtrl = require('../../controllers/user/register/deleteuser');
router.post('/', registerNewUserCtrl.registernewuser);
router.post('/verifyotp', verifyotpForUserCtrl.verifyotpforuser);
router.post('/forgotpassword', forgotUserPasswordCtrl.forgotuserpassword);
router.post('/changepassword', changeUserPasswordCtrl.changeuserpassword);
router.post('/deleteuser', helper.authenticateToken, deleteUserCtrl.deleteuser);
module.exports = router;