let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const listBookingsCtrl = require('../../controllers/organizer/events/eventbooking');
router.post('/list', helper.authenticateToken, listBookingsCtrl.withpagination);
module.exports = router;