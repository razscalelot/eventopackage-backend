let express = require("express");
let router = express.Router();
const getonelistEventCtrl = require('../../controllers/landing/events');
router.get('/list', getonelistEventCtrl.withoutpagination);
router.get('/getone', getonelistEventCtrl.getoneevent);
module.exports = router;