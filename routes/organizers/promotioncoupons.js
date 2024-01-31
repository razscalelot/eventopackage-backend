let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const promotioncouponCtrl = require('../../controllers/organizer/promotions/promotioncoupons');
router.get('/list', helper.authenticateToken, promotioncouponCtrl.withoutpagination);
router.post('/getone', helper.authenticateToken, promotioncouponCtrl.getone);
module.exports = router;