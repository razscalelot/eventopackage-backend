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
  { pathUrl: '/events', routeFile: 'events'}
];
const subadminpaths = [
  { pathUrl: '/', routeFile: 'index'}
];
const superadminpaths = [
  { pathUrl: '/login', routeFile: 'login' },
];
const userpaths = [
  { pathUrl: '/', routeFile: 'index'}
];
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
app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
