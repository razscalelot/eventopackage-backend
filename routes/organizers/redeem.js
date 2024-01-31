var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const fcoinHistoryCtrl = require('../../controllers/organizer/redeem/history');
router.get('/history', helper.authenticateToken, fcoinHistoryCtrl.fcoinhistory);
module.exports = router;