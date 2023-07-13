let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const superadminModel = require('../../models/superadmins.model');
const { default: mongoose } = require("mongoose");
const AwsCloud = require('../../utilities/aws');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/agentReport.xlsx';
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search, sortfield, sortoption } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            primary.model(constants.MODELS.users, userModel).paginate({
                $or: [
                    { name: { '$regex': new RegExp(search, "i") } },
                    { email: { '$regex': new RegExp(search, "i") } },
                    { mobile: { '$regex': new RegExp(search, "i") } },
                    { country_code: { '$regex': new RegExp(search, "i") } },
                    { refer_code: { '$regex': new RegExp(search, "i") } },
                    { my_refer_code: { '$regex': new RegExp(search, "i") } },
                    { about: { '$regex': new RegExp(search, "i") } }
                ]
            }, {
                page,
                limit: parseInt(limit),
                sort: { [sortfield]: [sortoption] },
                select: '-password',
                lean: true
            }).then((userList) => {
                return responseManager.onSuccess('users list!', userList, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get users list, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { userid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            if (userid && userid != '' && mongoose.Types.ObjectId.isValid(userid)) {
                let userData = await primary.model(constants.MODELS.users, userModel).findById(userid).select('-password').lean();
                return responseManager.onSuccess('User data !', userData, res);
            } else {
                return responseManager.badrequest({ message: 'Invalid user id to get user data, please try again' }, res);
            }
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get user data, please try again' }, res);
    }
});
router.post('/export', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            let userlist = await primary.model(constants.MODELS.users, userModel).find({}).lean();
            var ext = 'xlsx';
            var date = new Date();
            var timestamp = date.getTime().toString();
            const fileName = 'userReport/' + 'DOC' + '/userReport-' + helper.makeid(7) + timestamp + '.' + ext;
            const workbook = new jsonexcel.Workbook();
            const sheet1 = workbook.addWorksheet('userReport');
            sheet1.columns = [
                {
                    header: 'Name',
                    key: 'name',
                    width: 40
                },
                {
                    header: 'Email',
                    key: 'email',
                    width: 40
                },
                {
                    header: 'Country Code',
                    key: 'country_code',
                    width: 30
                },
                {
                    header: 'Mobile',
                    key: 'mobile',
                    width: 40
                },
                {
                    header: 'Mobile Verification',
                    key: 'mobileverified',
                    width: 40
                },
                {
                    header: 'Reference By',
                    key: 'refer_code',
                    width: 30
                },
                {
                    header: 'Refer Code',
                    key: 'my_refer_code',
                    width: 30
                },
                {
                    header: 'F-Coin Balance',
                    key: 'f_coin',
                    width: 30
                },
                {
                    header: 'Registration Time',
                    key: 'createdAt',
                    style: { numFmt: 'dd/mm/yyyy h:mm:ss' },
                    width: 50
                },
                {
                    header: 'Last Login At',
                    key: 'last_login_at',
                    style: { numFmt: 'dd/mm/yyyy h:mm:ss' },
                    width: 50
                },
                {
                    header: 'About',
                    key: 'about',
                    width: 40
                }
            ];
            async.forEachSeries(userlist, (user, next_user) => {
                let obj = {
                    name : (user.name && user.name != '') ? user.name : 'N/A',
                    email : (user.email && user.email != '') ? user.email : 'N/A',
                    country_code : (user.country_code && user.country_code != '') ? user.country_code : 'N/A',
                    mobile : (user.mobile && user.mobile != '') ? user.mobile : 'N/A',
                    mobileverified : (user.mobileverified && user.mobileverified != '') ? user.mobileverified : 'N/A',
                    refer_code : (user.refer_code && user.refer_code != '') ? user.refer_code : 'N/A',
                    my_refer_code : (user.my_refer_code && user.my_refer_code != '') ? user.my_refer_code : 'N/A',
                    createdAt : new Date(user.createdAt),
                    last_login_at : (user.last_login_at && user.last_login_at != '') ? new Date(user.last_login_at + 19800000) : 'N/A',
                    about : (user.about && user.about != '') ? user.about : 'N/A'
                };
                sheet1.addRow(obj);
                next_user();
            }, () => {
                workbook.xlsx.writeFile(excelFileName).then(() => {
                    var data = fs.readFileSync(excelFileName);
                    if (data) {
                        AwsCloud.saveToS3withFileName(data, req.token.superadminid.toString(), 'application/vnd.ms-excel', fileName).then((fileresponse) => {
                            return responseManager.onSuccess('file added successfully', process.env.AWS_BUCKET_URI + fileresponse.data.Key, res);
                        }).catch((err) => {
                            return responseManager.onError(err, res);
                        });
                    }
                });
            });
        } else {
            return responseManager.unauthorisedRequest(res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to export users list, please try again' }, res);
    }
});
module.exports = router;