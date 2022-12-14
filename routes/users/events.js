var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const eventListCtrl = require('../../controllers/user/events/list');
const getoneCtrl = require('../../controllers/user/events/getone');
const ratingCtrl = require('../../controllers/user/events/review');
const wishlistCtrl = require('../../controllers/user/events/wishlist');
// post apis
router.post('/list', helper.authenticateToken, eventListCtrl.list);
router.post('/review', helper.authenticateToken, ratingCtrl.review);
router.post('/wishlist', helper.authenticateToken, wishlistCtrl.wishlist);
// get apis
router.get('/getone', helper.authenticateToken, getoneCtrl.getone);

module.exports = router;