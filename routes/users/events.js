var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
const eventListCtrl = require('../../controllers/user/events/list');
const getoneCtrl = require('../../controllers/user/events/getone');
const ratingCtrl = require('../../controllers/user/events/review');
const wishlistCtrl = require('../../controllers/user/events/wishlist');
const bookingCtrl = require('../../controllers/user/booking/booking');
// post apis
router.post('/list', helper.authenticateToken, eventListCtrl.list);
router.post('/review', helper.authenticateToken, ratingCtrl.review);
router.post('/wishlist', helper.authenticateToken, wishlistCtrl.wishlist);
router.post('/wishlist/getone', helper.authenticateToken, wishlistCtrl.getone);
router.post('/wishlist/remove', helper.authenticateToken, wishlistCtrl.remove);
router.post('/booking', helper.authenticateToken, bookingCtrl.booking);
router.post('/checkavailability', helper.authenticateToken, bookingCtrl.checkavailability);
// get apis
router.get('/getone', helper.authenticateToken, getoneCtrl.getone);
router.get('/wishlist/list', helper.authenticateToken, wishlistCtrl.list);
router.get('/bookinglist', helper.authenticateToken, bookingCtrl.bookinglist);

module.exports = router;