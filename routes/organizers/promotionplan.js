let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const promotionPlanCtrl = require('../../controllers/organizer/promotions/promotionplans');
router.get('/list', helper.authenticateToken, promotionPlanCtrl.withoutpagination);
router.post('/getone', helper.authenticateToken, promotionPlanCtrl.getone);
module.exports = router;