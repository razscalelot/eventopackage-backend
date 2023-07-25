const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const notificationModel = require("../../../models/notifications.model");
const customerimportModel = require("../../../models/customerimports.model");
const organizerModel = require('../../../models/organizers.model');
const csv = require("csvtojson");
const mongoose = require('mongoose');
const async = require('async');
const specialChars = "<>@!#$%^&*()_+[]{}?:;|'\"\\,./~`-=";
const checkForSpecialChar = function (string) {
    for (i = 0; i < specialChars.length; i++) {
        if (string.indexOf(specialChars[i]) > -1) {
            return true
        }
    }
    return false;
};
exports.import = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            const { notificationid } = req.body;
            if(req.file && req.file != '' && notificationid && notificationid != '' && mongoose.Types.ObjectId.isValid(notificationid)){
                let notificationData = await primary.model(constants.MODELS.notifications, notificationModel).findById(notificationid).lean();
                if(notificationData && notificationData != null){
                    if(req.file.mimetype == 'text/csv'){
                        let list = await csv().fromString(req.file.buffer.toString());
                        let lengthOfList = parseInt(list.length);
                        let numberOfImports = parseInt(Math.ceil(lengthOfList / process.env.IMPORT_PARTITION_LIMIT));
                        let finalbatchArray = [];
                        for (var i = 0; i < numberOfImports; i++) {
                            let partition = list.slice((i == 0) ? i : i * process.env.IMPORT_PARTITION_LIMIT, (i == 0) ? process.env.IMPORT_PARTITION_LIMIT : (i + 1) * process.env.IMPORT_PARTITION_LIMIT);
                            if (partition.length > 0) {
                                finalbatchArray.push({
                                    batchno: i + 1,
                                    list: partition
                                });
                            }
                        }
                        let importCount = 0;
                        let rejectedCount = 0;
                        let rejectedRecords = [];
                        async.forEachSeries(finalbatchArray, (batchArray, next_batchArray) => {
                            async.forEachSeries(batchArray.list, (customer, next_customer) => {
                                ( async () => {
                                    if((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(customer["EmailId"]))){
                                        if(!isNaN(customer["MobileNumber"]) && customer["MobileNumber"].length > 10){
                                            if(checkForSpecialChar(customer["MobileNumber"])){
                                                rejectedCount++;
                                                rejectedRecords.push({message : 'Invalid Customer Mobile Number Special Chars not allowed', customer : customer});
                                                next_customer();
                                            }else{
                                                customer.notificationid = mongoose.Types.ObjectId(notificationid);
                                                customer.selected = false;
                                                customer.createdBy = mongoose.Types.ObjectId(req.token.organizerid);
                                                await primary.model(constants.MODELS.customerimports, customerimportModel).create(customer);
                                                importCount++;
                                                next_customer();
                                            }
                                        }else{
                                            rejectedCount++;
                                            rejectedRecords.push({message : 'Invalid Customer Mobile Number', customer : customer});
                                            next_customer();
                                        }
                                    }else{
                                        rejectedCount++;
                                        rejectedRecords.push({message : 'Invalid Customer Email ID', customer : customer});
                                        next_customer();
                                    }
                                })().catch((error) => {
                                    next_customer();
                                });
                            }, () => {
                                next_batchArray();
                            });
                        }, () => {
                            return responseManager.onSuccess('File uploaded successfully!', {importCount : importCount, rejectedCount : rejectedCount, rejectedRecords : rejectedRecords}, res);
                        });
                    }else{
                        return responseManager.badrequest({ message: 'Invalid file type to import users only CSV file allowed, please try again' }, res);
                    }
                }else{
                    return responseManager.badrequest({ message: 'Invalid notificationid to import users, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid notificationid or excel to import users, please try again' }, res);
            }
        }else {
            return responseManager.badrequest({ message: 'Invalid organizerid to set notification schedule, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};