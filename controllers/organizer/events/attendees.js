var express = require('express');
var router = express.Router();
const helper = require('../../../utilities/helper');
const organizerModel = require('../../../models/organizers.model');
const eventModel = require('../../../models/events.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const userModel = require('../../../models/users.model');
const responseManager = require('../../../utilities/response.manager');
const mongoConnection = require('../../../utilities/connections');
const constants = require('../../../utilities/constants');
const mongoose = require('mongoose');
const AwsCloud = require('../../../utilities/aws');
var jsonexcel = require('exceljs');
var fs = require('fs');
var excelFileName = 'downloadFiles/attendeesReport.xlsx';
const async = require('async');
exports.attendees = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid, page, limit } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if (eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)) {
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if (eventData && eventData.is_approved == true && eventData.status == true && eventData.createdBy.toString() == req.token.organizerid.toString()) {
                    primary.model(constants.MODELS.eventbookings, eventbookingModel).paginate({
                        eventId: mongoose.Types.ObjectId(eventid)
                    }, {
                        page,
                        limit: parseInt(limit),
                        sort: { _id: -1 },
                        populate: { path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name profile_pic" },
                        lean: true
                    }).then((attendeelist) => {
                        return responseManager.onSuccess("event booked list...", attendeelist, res);
                    }).catch((error) => {
                        return responseManager.onError(error, res);
                    });
                } else {
                    return responseManager.badrequest({ message: 'Invalid eventid to get event attendees list, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid eventid to get event attendees list, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event attendees list, please try again' }, res);
        }
    } else {
        return responseManager.unauthorisedRequest(res);
    }
};
exports.export = async (req, res) => {
    if (req.token.organizerid && mongoose.Types.ObjectId.isValid(req.token.organizerid)) {
        const { eventid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let organizerData = await primary.model(constants.MODELS.organizers, organizerModel).findById(req.token.organizerid).select('-password').lean();
        if (organizerData && organizerData.status == true && organizerData.mobileverified == true && organizerData.is_approved == true) {
            if(eventid && eventid != '' && mongoose.Types.ObjectId.isValid(eventid)){
                let eventData = await primary.model(constants.MODELS.events, eventModel).findById(eventid).lean();
                if(eventData && eventData.is_approved == true && eventData.status == true && eventData.createdBy.toString() == req.token.organizerid.toString()){
                    let attendeelist = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({eventId : mongoose.Types.ObjectId(eventid)}).populate({path: 'userid', model: primary.model(constants.MODELS.users, userModel), select: "name email mobile"}).lean();
                    var ext = 'xlsx';
                    var date = new Date();
                    var timestamp = date.getTime().toString();
                    const fileName = 'attendeesReport/' + 'DOC' + '/attendeesReport-' + helper.makeid(7) + timestamp + '.' + ext;
                    const workbook = new jsonexcel.Workbook();
                    const sheet1 = workbook.addWorksheet('attendeesReport');
                    sheet1.columns = [
                        {
                            header: 'Invoice Number',
                            key: 'invoice_no',
                            width: 40
                        },
                        {
                            header: 'Attendee Name',
                            key: 'attendee_name',
                            width: 50
                        },
                        {
                            header: 'Event Name',
                            key: 'event_name',
                            width: 50
                        },
                        {
                            header: 'Payment ID',
                            key: 'payment_id',
                            width: 50
                        },
                        {
                            header: 'Status',
                            key: 'status',
                            width: 30
                        },
                        {
                            header: 'Sub Total',
                            key: 'subTotal',
                            width: 40
                        },
                        {
                            header: 'Coupon Amount',
                            key: 'couponAmount',
                            width: 40
                        },
                        {
                            header: 'Final Total',
                            key: 'finalTotal',
                            width: 40
                        },
                        {
                            header: 'Discount Amount',
                            key: 'discountOnTotalBill',
                            width: 40
                        },
                        {
                            header: 'Net Paid Amount',
                            key: 'amount',
                            width: 40
                        },
                        {
                            header: 'Date Time',
                            key: 'timestamp',
                            style: { numFmt: 'dd/mm/yyyy h:mm:ss' },
                            width: 50
                        },
                        {
                            header: 'Invoice URL',
                            key: 'invoice_url',
                            width: 80
                        },
                        {
                            header: 'Total Seat Booked',
                            key: 'totalseats',
                            width: 30
                        },
                        {
                            header: 'Seat Details',
                            key: 'seatsdetails',
                            width: 100
                        }
                    ];
                    console.log("eventData", eventData);
                    async.forEachSeries(attendeelist, (attendee, next_attendee) => {
                        let totalseats = 0;
                        let seatsdetails = "";
                        let obj = {
                            invoice_no : attendee.invoice_no,
                            attendee_name : attendee.userid.name,
                            event_name : eventData.display_name,
                            payment_id : attendee.payment_id,
                            status : attendee.status,
                            subTotal : attendee.subTotal,
                            couponAmount : attendee.couponAmount,
                            finalTotal : attendee.finalTotal,
                            discountOnTotalBill : attendee.discountOnTotalBill,
                            amount : attendee.amount,
                            timestamp : new Date(attendee.timestamp),
                            invoice_url : process.env.AWS_BUCKET_URI+attendee.invoice_url,
                            totalseats : totalseats,
                            seatsdetails : seatsdetails
                        };
                        async.forEachSeries(attendee.seats, (seat, next_seat) => {
                            async.forEachSeries(seat.arrangements, (arrangement, next_arrangement) => {
                                let eqpincluded = (seat.equipment == true) ? "Included" : "Not-Included";
                                totalseats += parseInt(arrangement.ItemCount);
                                seatsdetails += " ( "+seat.seating_item.itemname+" | "+arrangement.vertical_location+" - "+arrangement.horizontal_location+" | "+arrangement.ItemCount+" | "+" FOOD - "+seat.food+" | "+" Eqp. - "+ eqpincluded + " ) ";
                                next_arrangement();
                            }, () => {
                                next_seat();
                            });
                        }, () => {
                            obj.totalseats = totalseats;
                            obj.seatsdetails = seatsdetails;
                            sheet1.addRow(obj);
                            next_attendee();
                        });
                    }, () => {
                        workbook.xlsx.writeFile(excelFileName).then(() => {
                            var data = fs.readFileSync(excelFileName);
                            if (data) {
                                AwsCloud.saveToS3withFileName(data, req.token.organizerid.toString(), 'application/vnd.ms-excel', fileName).then((fileresponse) => {
                                    return responseManager.onSuccess('file added successfully', process.env.AWS_BUCKET_URI + fileresponse.data.Key, res);
                                }).catch((err) => {
                                    return responseManager.onError(err, res);
                                });
                            }
                        });
                    });
                }else{
                    return responseManager.badrequest({ message: 'Invalid eventid to get event attendees export report, please try again' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid eventid to get event attendees export report, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid organizerid to get event attendees export report, please try again' }, res);
        }
    }else{
        return responseManager.unauthorisedRequest(res);
    }
};