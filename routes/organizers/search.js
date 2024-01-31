let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const globalSearchCtrl = require('../../controllers/organizer/globalsearch/search');
router.post('/', helper.authenticateToken, globalSearchCtrl.globalsearch);
module.exports = router;