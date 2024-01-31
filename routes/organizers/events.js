var express = require('express');
var router = express.Router();
const helper = require('../../utilities/helper');
let fileHelper = require('../../utilities/multer.functions');
const createCtrl = require('../../controllers/organizer/events/create');
const aboutPlaceCtrl = require('../../controllers/organizer/events/aboutplace');
const personaldetailCtrl = require('../../controllers/organizer/events/personaldetail');
const mediaCtrl = require('../../controllers/organizer/events/media');
const serviceCtrl = require('../../controllers/organizer/events/service');
const itemCtrl = require('../../controllers/organizer/events/item');
const equipmentCtrl = require('../../controllers/organizer/events/equipment');
const othercostCtrl = require('../../controllers/organizer/events/othercost');
const categoryCtrl = require('../../controllers/organizer/events/categories');
const capacityCtrl = require('../../controllers/organizer/events/capacity');
const companydetailCtrl = require('../../controllers/organizer/events/companydetail');
const tandcCtrl = require('../../controllers/organizer/events/tandc');
const discountCtrl = require('../../controllers/organizer/events/discount');
const calendarCtrl = require('../../controllers/organizer/events/calendar');
const eventRemoveCtrl = require('../../controllers/organizer/events/remove');
const eventListCtrl = require('../../controllers/organizer/events/list');
const getoneCtrl = require('../../controllers/organizer/events/getone');
const attendeesCtrl = require('../../controllers/organizer/events/attendees');
const liveCtrl = require('../../controllers/organizer/events/live');
const uploadEventImageCtrl = require('../../controllers/organizer/events/uploadimage');
const uploadEventVideoCtrl = require('../../controllers/organizer/events/uploadvideo');
const uploadEventBannerCtrl = require('../../controllers/organizer/events/uploadbanner');
const uploadEventDocumentCtrl = require('../../controllers/organizer/events/uploaddocument');
// post apis
router.post('/save', helper.authenticateToken, createCtrl.createevent);
router.post('/aboutplace', helper.authenticateToken, aboutPlaceCtrl.aboutplace);
router.post('/personaldetail', helper.authenticateToken, personaldetailCtrl.personaldetail);
router.post('/media', helper.authenticateToken, mediaCtrl.media);
router.post('/selectservice', helper.authenticateToken, serviceCtrl.selectservice);
router.post('/selectservice', helper.authenticateToken, serviceCtrl.selectservice);
router.post('/selectitem', helper.authenticateToken, itemCtrl.selectitem);
router.post('/selectequipment', helper.authenticateToken, equipmentCtrl.selectequipment);
router.post('/othercost', helper.authenticateToken, othercostCtrl.othercost);
router.post('/capacity', helper.authenticateToken, capacityCtrl.capacity);
router.post('/companydetail', helper.authenticateToken, companydetailCtrl.companydetail);
router.post('/tandc', helper.authenticateToken, tandcCtrl.tandc);
router.post('/discount', helper.authenticateToken, discountCtrl.discount);
router.post('/calendar', helper.authenticateToken, calendarCtrl.calendar);
router.post('/remove', helper.authenticateToken, eventRemoveCtrl.removeevent);
router.post('/list', helper.authenticateToken, eventListCtrl.list);
router.post('/liveone', helper.authenticateToken, liveCtrl.makeonelive);
router.post('/livemulti', helper.authenticateToken, liveCtrl.makemultilive);
router.post('/attendees', helper.authenticateToken, attendeesCtrl.attendees);
router.post('/attendees/export', helper.authenticateToken, attendeesCtrl.export);
// get apis
router.get('/', helper.authenticateToken, createCtrl.getevent);
router.get('/aboutplace', helper.authenticateToken, aboutPlaceCtrl.getaboutplace);
router.get('/personaldetail', helper.authenticateToken, personaldetailCtrl.getpersonaldetail);
router.get('/media', helper.authenticateToken, mediaCtrl.getmedia);
router.get('/getselectservice', helper.authenticateToken, serviceCtrl.getselectservice);
router.get('/getselectitem', helper.authenticateToken, itemCtrl.getselectitem);
router.get('/getselectequipment', helper.authenticateToken, equipmentCtrl.getselectequipment);
router.get('/othercost', helper.authenticateToken, othercostCtrl.getothercost);
router.get('/capacity', helper.authenticateToken, capacityCtrl.getcapacity);
router.get('/companydetail', helper.authenticateToken, companydetailCtrl.getcompanydetail);
router.get('/tandc', helper.authenticateToken, tandcCtrl.gettandc);
router.get('/discount', helper.authenticateToken, discountCtrl.getdiscount);
router.get('/discount/getselectservice', helper.authenticateToken, discountCtrl.getselectservice);
// router.get('/calendar', helper.authenticateToken, calendarCtrl.getcalendar);
router.get('/getone', helper.authenticateToken, getoneCtrl.getone);
// organizer wise category
router.post('/addcategory', helper.authenticateToken, categoryCtrl.addcategory);
router.post('/getonecategory', helper.authenticateToken, categoryCtrl.getonecategory);
router.post('/removecategory', helper.authenticateToken, categoryCtrl.removecategory);
router.get('/listcategory', helper.authenticateToken, categoryCtrl.listcategory);
// end organizer wise category
// organizer wise services
router.post('/addservice', helper.authenticateToken, serviceCtrl.addservice);
router.post('/getoneservice', helper.authenticateToken, serviceCtrl.getoneservice);
router.post('/removeservice', helper.authenticateToken, serviceCtrl.removeservice);
router.get('/listservice', helper.authenticateToken, serviceCtrl.listservice);
// end organizer wise services
// organizer wise items
router.post('/additem', helper.authenticateToken, itemCtrl.additem);
router.post('/getoneitem', helper.authenticateToken, itemCtrl.getoneitem);
router.post('/removeitem', helper.authenticateToken, itemCtrl.removeitem);
router.get('/listitem', helper.authenticateToken, itemCtrl.listitem);
// end organizer wise items
// organizer wise equipment
router.post('/addequipment', helper.authenticateToken, equipmentCtrl.addequipment);
router.post('/getoneequipment', helper.authenticateToken, equipmentCtrl.getoneequipment);
router.post('/removeequipment', helper.authenticateToken, equipmentCtrl.removeequipment);
router.get('/listequipment', helper.authenticateToken, equipmentCtrl.listequipment);
// end organizer wise equipment
router.post('/image', helper.authenticateToken, fileHelper.memoryUpload.single('file'), uploadEventImageCtrl.uploadimage);
router.post('/video', helper.authenticateToken, fileHelper.memoryUpload.single('file'), uploadEventVideoCtrl.uploadvideo);
router.post('/banner', helper.authenticateToken, fileHelper.memoryUpload.single('file'), uploadEventBannerCtrl.uploadbanner);
router.post('/document', helper.authenticateToken, fileHelper.memoryUpload.single('file'), uploadEventDocumentCtrl.uploaddocument);
module.exports = router;