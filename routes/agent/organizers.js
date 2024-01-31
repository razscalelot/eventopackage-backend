let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const listOrganizerCtrl = require('../../controllers/agent/organizer/list');
router.post('/', helper.authenticateToken, listOrganizerCtrl.withpagination);
module.exports = router;