var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const eventListCtrl = require('../../controllers/user/events/list');
const getoneCtrl = require('../../controllers/user/events/getone');
// post apis
router.post('/list', helper.authenticateToken, eventListCtrl.list);
// get apis
router.get('/getone', helper.authenticateToken, getoneCtrl.getone);

module.exports = router;