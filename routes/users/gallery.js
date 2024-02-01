let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const listEntertainmentCtrl = require('../../controllers/user/entertainments/list');
const commentForEntertainmentCtrl = require('../../controllers/user/entertainments/comment');
router.post('/', helper.authenticateToken, listEntertainmentCtrl.withpagination);
router.post('/comment', helper.authenticateToken, commentForEntertainmentCtrl.addcomment);
router.post('/allcomments', helper.authenticateToken, commentForEntertainmentCtrl.withoutpagination);
module.exports = router;