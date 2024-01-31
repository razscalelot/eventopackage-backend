let express = require("express");
let router = express.Router();
const loginAgentCtrl = require('../../controllers/agent/login/login');
router.post('/', loginAgentCtrl.loginagent);
module.exports = router;
