const dotenv = require('dotenv').config();
const cors = require('cors');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
let mongoose = require("mongoose");
var expressLayouts = require('express-ejs-layouts');
var indexRouter = require('./routes/index');
const helper = require('./utilities/helper');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
mongoose.set('runValidators', true);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.once('open', () => {
  console.log("Well done! , connected with mongoDB database");
}).on('error', error => {
  console.log("Oops! database connection error:" + error);
});
app.use('/', indexRouter);
app.use('/qrscan', require('./routes/qrscan'));
app.use('/coin', require('./routes/qrscan'));
const landingpaths = [
  { pathUrl: '/getintouch', routeFile: 'getintouch'},
  { pathUrl: '/events', routeFile: 'event'},
];
const adminpaths = [
  { pathUrl: '/', routeFile: 'index'}
];
const executivepaths = [
  { pathUrl: '/', routeFile: 'index'}
];
const organizerpaths = [
  { pathUrl: '/', routeFile: 'index' },
  { pathUrl: '/login', routeFile: 'login' },
  { pathUrl: '/register', routeFile: 'register' },
  { pathUrl: '/profile', routeFile: 'profile'},
  { pathUrl: '/events', routeFile: 'events'},
  { pathUrl: '/booking', routeFile: 'booking'},
  { pathUrl: '/invoice', routeFile: 'invoice'},
  { pathUrl: '/discount', routeFile: 'discount' },
  { pathUrl: '/gallery', routeFile: 'gallery' },
  { pathUrl: '/promotionplan', routeFile: 'promotionplan'},
  { pathUrl: '/notification', routeFile: 'notification'},
  { pathUrl: '/promotion', routeFile: 'promotion'},
  { pathUrl: '/notificationcoupons', routeFile: 'notificationcoupons'},
  { pathUrl: '/redeem', routeFile: 'redeem' },
  { pathUrl: '/search', routeFile: 'search'},
];
const subadminpaths = [
  { pathUrl: '/', routeFile: 'index'}
];
const superadminpaths = [
  { pathUrl: '/login', routeFile: 'login' },
  { pathUrl: '/discount', routeFile: 'discount' },
  { pathUrl: '/organizer', routeFile: 'organizer' },
  { pathUrl: '/event', routeFile: 'event' },
  { pathUrl: '/service', routeFile: 'service' },
  { pathUrl: '/item', routeFile: 'item' },
  { pathUrl: '/equipment', routeFile: 'equipment' },
  { pathUrl: '/eventcategories', routeFile: 'eventcategories' },
  { pathUrl: '/admin', routeFile: 'admin' },
  { pathUrl: '/subadmin', routeFile: 'subadmin' },
  { pathUrl: '/executive', routeFile: 'executive' },
  { pathUrl: '/ourproduct', routeFile: 'ourproduct' },
  { pathUrl: '/media', routeFile: 'media'},
  { pathUrl: '/promotionplans', routeFile: 'promotionplans'},
  { pathUrl: '/notificationcoupons', routeFile: 'notificationcoupons'},
  { pathUrl: '/eventbookingcoupons', routeFile: 'eventbookingcoupons'},
  { pathUrl: '/agent', routeFile: 'agent'},
  { pathUrl: '/fcoin', routeFile: 'fcoin' },
  { pathUrl: '/users', routeFile: 'users' }
];
const userpaths = [
  { pathUrl: '/', routeFile: 'index'},
  { pathUrl: '/login', routeFile: 'login' },
  { pathUrl: '/register', routeFile: 'register' },
  { pathUrl: '/profile', routeFile: 'profile'},
  { pathUrl: '/events', routeFile: 'events' },
  { pathUrl: '/invoice', routeFile: 'invoice'},
  { pathUrl: '/gallery', routeFile: 'gallery' },
  { pathUrl: '/eventbookingcoupons', routeFile: 'eventbookingcoupons'},
  { pathUrl: '/redeem', routeFile: 'redeem' }
];
const agentpaths = [
  { pathUrl: '/', routeFile: 'index'},
  { pathUrl: '/login', routeFile: 'login'},
  { pathUrl: '/register', routeFile: 'register'},
  { pathUrl: '/profile', routeFile: 'profile'},
  { pathUrl: '/organisers', routeFile: 'organisers'},
];
landingpaths.forEach((path) => {
	app.use('/landing'+path.pathUrl, require('./routes/landing/' + path.routeFile));
});
adminpaths.forEach((path) => {
	app.use('/admin'+path.pathUrl, require('./routes/admins/' + path.routeFile));
});
executivepaths.forEach((path) => {
	app.use('/executive'+path.pathUrl, require('./routes/executives/' + path.routeFile));
});
organizerpaths.forEach((path) => {
	app.use('/organizer'+path.pathUrl, require('./routes/organizers/' + path.routeFile));
});
subadminpaths.forEach((path) => {
	app.use('/subadmin'+path.pathUrl, require('./routes/subadmins/' + path.routeFile));
});
superadminpaths.forEach((path) => {
	app.use('/superadmin'+path.pathUrl, require('./routes/superadmins/' + path.routeFile));
});
userpaths.forEach((path) => {
	app.use('/user'+path.pathUrl, require('./routes/users/' + path.routeFile));
});
agentpaths.forEach((path) => {
	app.use('/agent'+path.pathUrl, require('./routes/agent/' + path.routeFile));
});
app.use(function(req, res, next) {
  next(createError(404));
});
// let decPassword = helper.passwordDecryptor('U2FsdGVkX1+80LK1PQsHI8TkENVsEsgXPTR962xEKNxWdJ5fbfpOYRtklQ2/pf4EZljUNsBQ4KWN0H7mvqWh4C3ve7Y+vioezrhGRWwyyxkhJe80cysm3URoRwBkLOdclPxMa8lq8otAorPwCNPAeg==');
// console.log("decPassword", decPassword);
// let ecnPassword = helper.passwordEncryptor('Global@1811');
// console.log("ecnPassword", ecnPassword);
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
