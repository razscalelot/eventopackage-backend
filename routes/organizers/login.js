let express = require("express");
let router = express.Router();
const organizerLoginCtrl = require('../../controllers/organizer/login/login');
router.post('/', organizerLoginCtrl.loginorganizer);
module.exports = router;
