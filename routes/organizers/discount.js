let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const listgetoneEventDiscountCtrl = require('../../controllers/organizer/events/eventdiscounts');
router.get('/list', helper.authenticateToken, listgetoneEventDiscountCtrl.withoutpagination);
router.post('/getone', helper.authenticateToken, listgetoneEventDiscountCtrl.getone);
module.exports = router;