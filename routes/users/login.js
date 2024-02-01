let express = require("express");
let router = express.Router();
const userLoginCtrl = require('../../controllers/user/login/login');
router.post('/', userLoginCtrl.userlogin);
module.exports = router;
