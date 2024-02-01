let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const eventBookingCouponsCtrl = require('../../controllers/user/events/bookingcoupons');
router.get('/list', helper.authenticateToken, eventBookingCouponsCtrl.withoutpagination);
router.post('/getone', helper.authenticateToken, eventBookingCouponsCtrl.getone);
module.exports = router;