let express = require("express");
let router = express.Router();
const getintouchCtrl = require('../../controllers/landing/getintouch');
router.post('/', getintouchCtrl.landingpageregistration);
router.post('/newlanding', getintouchCtrl.registerpageregistration);
module.exports = router;