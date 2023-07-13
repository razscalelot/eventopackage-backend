let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const organizerModel = require('../../models/organizers.model');
const agentModel = require('../../models/agents.model');
const superadminModel = require('../../models/superadmins.model');
const eventModel = require('../../models/events.model');
const { default: mongoose } = require("mongoose");
const AwsCloud = require('../../utilities/aws');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/organizerReport.xlsx';
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { page, limit, search, sortfield, sortoption } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            primary.model(constants.MODELS.organizers, organizerModel).paginate({
                $or: [
                    { name : { '$regex' : new RegExp(search, "i") } },
                    { email : { '$regex' : new RegExp(search, "i") } },
                    { mobile : { '$regex' : new RegExp(search, "i") } },
                    { refer_code : { '$regex' : new RegExp(search, "i") } },
                    { my_refer_code : { '$regex' : new RegExp(search, "i") } },
                    { about : { '$regex' : new RegExp(search, "i") } },
                    { city : { '$regex' : new RegExp(search, "i") } },
                    { country : { '$regex' : new RegExp(search, "i") } },
                    { state : { '$regex' : new RegExp(search, "i") } },
                    { pincode : { '$regex' : new RegExp(search, "i") } }
                ]
            },{
                page,
                limit: parseInt(limit),
                sort: { [sortfield] : [sortoption] },
                populate: ({
                    path: 'agentid',
                    model: primary.model(constants.MODELS.agents, agentModel),
                    select: 'name email mobile country_code'
                }),
                lean: true
            }).then((organizersList) => {
                return responseManager.onSuccess('organizers list!', organizersList, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get organizers list, please try again' }, res);
    }
});
router.post('/approve', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid).lean();
                if(organizerData && organizerData.mobileverified == true){
                    if(organizerData.is_approved == false){
                        await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, {is_approved : true});
                        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid).lean();
                        return responseManager.onSuccess('Organizer approved sucecssfully!', organizerData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Organizer is already approved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Organizer mobile number is not verified yet, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid organizer id to approve organizer, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/disapprove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid).lean();
                if(organizerData && organizerData.mobileverified == true){
                    if(organizerData.is_approved == true){
                        await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndUpdate(organizerid, {is_approved : false});
                        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid).lean();
                        return responseManager.onSuccess('Organizer disapproved sucecssfully!', organizerData, res);
                    }else{
                        return responseManager.badrequest({ message: 'Organizer is already disapproved' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Organizer mobile number is not verified yet, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid organizer id to approve organizer, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/remove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                await primary.model(constants.MODELS.organizers, organizerModel).findByIdAndRemove(organizerid);
                await primary.model(constants.MODELS.events, eventModel).deleteMany({createdBy : mongoose.Types.ObjectId(organizerid)});
                return responseManager.onSuccess('Organizer removed sucecssfully!', 1, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid organizer id to remove organizer, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        const { organizerid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if(superadmin){
            if(organizerid && organizerid != '' && mongoose.Types.ObjectId.isValid(organizerid)){
                let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(organizerid);
                return responseManager.onSuccess('Organizer data !', organizerData, res);
            }else{
                return responseManager.badrequest({ message: 'Invalid organizer id to get organizer data, please try again' }, res);
            }
        }else{
            return responseManager.unauthorisedRequest(res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get organizer data, please try again' }, res);
    }
});
router.post('/export', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.superadminid && mongoose.Types.ObjectId.isValid(req.token.superadminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadmin = await primary.model(constants.MODELS.superadmins, superadminModel).findById(req.token.superadminid).lean();
        if (superadmin) {
            let organizerlist = await primary.model(constants.MODELS.organizers, organizerModel).find({}).populate({path: 'agentid', model: primary.model(constants.MODELS.agents, agentModel), select: "name email mobile"}).lean();
            var ext = 'xlsx';
            var date = new Date();
            var timestamp = date.getTime().toString();
            const fileName = 'organizerReport/' + 'DOC' + '/organizerReport-' + helper.makeid(7) + timestamp + '.' + ext;
            const workbook = new jsonexcel.Workbook();
            const sheet1 = workbook.addWorksheet('organizerReport');
            sheet1.columns = [
                {
                    header: 'Organizer Name',
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
                    header: 'Agent Name',
                    key: 'agentname',
                    width: 40
                },
                {
                    header: 'Agent Email',
                    key: 'agentemail',
                    width: 40
                },
                {
                    header: 'Agent Mobile',
                    key: 'agentmobile',
                    width: 40
                },
                {
                    header: 'Approval',
                    key: 'is_approved',
                    width: 40
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
                    header: 'Flat No',
                    key: 'flat_no',
                    width: 40
                },
                {
                    header: 'Street',
                    key: 'street',
                    width: 40
                },
                {
                    header: 'Area',
                    key: 'area',
                    width: 40
                },
                {
                    header: 'City',
                    key: 'city',
                    width: 40
                },
                {
                    header: 'State',
                    key: 'state',
                    width: 40
                },
                {
                    header: 'Country',
                    key: 'country',
                    width: 40
                },
                {
                    header: 'Pincode',
                    key: 'pincode',
                    width: 40
                },
                {
                    header: 'About',
                    key: 'about',
                    width: 40
                }
            ];
            async.forEachSeries(organizerlist, (organizer, next_organizer) => {
                let obj = {
                    name : (organizer.name && organizer.name != '') ? organizer.name : 'N/A',
                    email : (organizer.email && organizer.email != '') ? organizer.email : 'N/A',
                    country_code : (organizer.country_code && organizer.country_code != '') ? organizer.country_code : 'N/A',
                    mobile : (organizer.mobile && organizer.mobile != '') ? organizer.mobile : 'N/A',
                    mobileverified : (organizer.mobileverified && organizer.mobileverified != '') ? organizer.mobileverified : 'N/A',
                    refer_code : (organizer.refer_code && organizer.refer_code != '') ? organizer.refer_code : 'N/A',
                    my_refer_code : (organizer.my_refer_code && organizer.my_refer_code != '') ? organizer.my_refer_code : 'N/A',
                    agentname : (organizer.agentid && organizer.agentid != '' && organizer.agentid != null) ? organizer.agentid.name : 'N/A',
                    agentemail : (organizer.agentid && organizer.agentid != '' && organizer.agentid != null) ? organizer.agentid.email : 'N/A',
                    agentmobile : (organizer.agentid && organizer.agentid != '' && organizer.agentid != null) ? organizer.agentid.mobile : 'N/A',
                    is_approved : organizer.is_approved,
                    createdAt : new Date(organizer.createdAt),
                    last_login_at : (organizer.last_login_at && organizer.last_login_at != '') ? new Date(organizer.last_login_at + 19800000) : 'N/A',
                    flat_no : (organizer.flat_no && organizer.flat_no != '') ? organizer.flat_no : 'N/A',
                    street : (organizer.street && organizer.street != '') ? organizer.street : 'N/A',
                    area : (organizer.area && organizer.area != '') ? organizer.area : 'N/A',
                    city : (organizer.city && organizer.city != '') ? organizer.city : 'N/A',
                    state : (organizer.state && organizer.state != '') ? organizer.state : 'N/A',
                    country : (organizer.country && organizer.country != '') ? organizer.country : 'N/A',
                    pincode : (organizer.pincode && organizer.pincode != '') ? organizer.pincode : 'N/A',
                    about : (organizer.about && organizer.about != '') ? organizer.about : 'N/A'
                };
                sheet1.addRow(obj);
                next_organizer();
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
        return responseManager.badrequest({ message: 'Invalid token to export organizer data, please try again' }, res);
    }
});
module.exports = router;