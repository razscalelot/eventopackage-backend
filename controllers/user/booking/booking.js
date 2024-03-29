const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const userModel = require('../../../models/users.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const eventModel = require('../../../models/events.model');
const eventreviewModel = require('../../../models/eventreviews.model');
const serviceModel = require('../../../models/service.model');
const itemModel = require('../../../models/items.model');
const equipmentModel = require('../../../models/equipments.model');
const awsCloud = require('../../../utilities/aws');
const async = require("async");
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const fs = require('fs');
var pdfFilename = 'downloadFiles/invoice.pdf';
const option = { format: 'A4' };
function minusHours(date, hours) {
    const dateCopy = new Date(date);
    dateCopy.setHours(dateCopy.getHours() - hours);
    return dateCopy.getTime();
}
function addHours(date, hours) {
    const dateCopy = new Date(date);
    dateCopy.setHours(dateCopy.getHours() + hours);
    return dateCopy.getTime();
}
function timeDiffCalc(dateFuture, dateNow) {
    let diffInMilliSeconds = Math.abs(dateFuture - dateNow) / 1000;
    const days = Math.floor(diffInMilliSeconds / 86400);
    const onlyhours = Math.floor(diffInMilliSeconds / 3600);
    diffInMilliSeconds -= days * 86400;
    const hours = Math.floor(diffInMilliSeconds / 3600) % 24;
    diffInMilliSeconds -= hours * 3600;
    const minutes = Math.floor(diffInMilliSeconds / 60) % 60;
    diffInMilliSeconds -= minutes * 60;
    let difference = '';
    if (days > 0) {
        difference += (days === 1) ? `${days} day, ` : `${days} days, `;
    }
    difference += (hours === 0 || hours === 1) ? `${hours} hour, ` : `${hours} hours, `;
    difference += (minutes === 0 || hours === 1) ? `${minutes} minutes` : `${minutes} minutes`;
    return {
        day: days,
        hour: hours,
        minute: minutes,
        onlyhours: onlyhours
    };
}
function pHourpDaypEventCalc(service, startTimestamp, endTimestamp) {
    let delta = timeDiffCalc(startTimestamp, endTimestamp);
    let time = '';
    if (service.price_type == 'per_hour') {
        time = delta.onlyhours + ' hours';
    }
    if (service.price_type == 'per_day') {
        if (delta.hour >= 1) {
            time = (delta.day + 1) + ' days';
        } else {
            time = delta.day + ' days';
        }
    }
    if (service.price_type == 'per_event' || service.price_type == 'per_person') {
        if (delta.hour >= 1) {
            time = (delta.day + 1) + ' days';
        } else {
            time = delta.day + ' days';
        }
    }
    return time;
}
function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}
exports.booking = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            let body = req.body;
            if (body.user && body.user != '' && mongoose.Types.ObjectId.isValid(body.user) && body.eventId && body.eventId != '' && mongoose.Types.ObjectId.isValid(body.eventId)) {
                if (body.start_date && body.end_date && body.start_time && body.end_time) {
                    let totalInvoice = parseInt(await primary.model(constants.MODELS.eventbookings, eventbookingModel).countDocuments({}));
                    let invoiceNo = helper.getInvoiceNo(totalInvoice);
                    let allItems = [];
                    let finalItems = [];
                    let finalEquipments = [];
                    let finalServices = [];
                    async.forEachSeries(body.selectedItems, (item, next_item) => {
                        if (item._id && item._id != '' && mongoose.Types.ObjectId.isValid(item._id)) {
                            item._id = mongoose.Types.ObjectId(item._id);
                            finalItems.push(item);
                            allItems.push(item);
                        }
                        next_item();
                    }, () => {
                        async.forEachSeries(body.selectedEquipments, (equipment, next_equipment) => {
                            if (equipment._id && equipment._id != '' && mongoose.Types.ObjectId.isValid(equipment._id)) {
                                equipment._id = mongoose.Types.ObjectId(equipment._id);
                                finalEquipments.push(equipment);
                                allItems.push(equipment);
                            }
                            next_equipment();
                        }, () => {
                            async.forEachSeries(body.selectedServices, (service, next_service) => {
                                if (service._id && service._id != '' && mongoose.Types.ObjectId.isValid(service._id)) {
                                    service._id = mongoose.Types.ObjectId(service._id);
                                    finalServices.push(service);
                                    allItems.push(service);
                                }
                                next_service();
                            }, () => {
                                (async () => {
                                    let xstart_date = body.start_date.split("-");
                                    let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + body.start_time).getTime();
                                    let yend_date = body.end_date.split("-");
                                    let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + body.end_time).getTime();
                                    body.userid = mongoose.Types.ObjectId(body.user);
                                    body.eventId = mongoose.Types.ObjectId(body.eventId);
                                    body.invoice_no = invoiceNo;
                                    body.isUserReview = false;
                                    body.created_at = Date.now();
                                    body.selectedItems = finalItems;
                                    body.selectedEquipments = finalEquipments;
                                    body.selectedServices = finalServices;
                                    body.start_timestamp = startTimestamp;
                                    body.end_timestamp = endTimestamp;
                                    let d = new Date();
                                    let ttinampm = formatAMPM(d);
                                    let day = d.getDate();
                                    let month = d.getMonth();
                                    let year = d.getFullYear();
                                    const allmonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    let finalDate = day + ' ' + allmonth[month] + ' ' + year;
                                    let items = '';
                                    async.forEachSeries(allItems, (item, next_item) => {
                                        let time = pHourpDaypEventCalc(item, startTimestamp, endTimestamp)
                                        items += `<tr style="text-align: left;">
                                                        <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 50%;">${item.name}</td>
                                                        <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${parseFloat(item.itemDiscountPrice ? item.itemDiscountPrice : item.itemFinalPrice).toFixed(2)}  ${item.price_type.trim().replace('_', ' ')}</td>
                                                        <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${time}</td>
                                                        <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${item.itemCount}</td>
                                                        <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 20%;">${parseFloat(item.itemDiscountPrice ? item.itemDiscountPrice * item.itemCount : item.itemFinalPrice * item.itemCount).toFixed(2)}</td>
                                                    </tr>`;
                                        next_item();
                                    }, () => {
                                        (async () => {
                                            const browser = await puppeteer.launch({
                                                executablePath: '/usr/bin/chromium-browser',
                                                args: ["--no-sandbox"]
                                            });
                                            const page = await browser.newPage();
                                            let bookedEvent = await primary.model(constants.MODELS.events, eventModel).findOne({ _id: mongoose.Types.ObjectId(body.eventId) }).lean();
                                            let ePrice = 0;
                                            let eTime = '';
                                            let eType = '';
                                            let eTotalPrice = 0;
                                            if (bookedEvent.aboutplace) {
                                                if (bookedEvent.aboutplace.place_price != '') {
                                                    eType = bookedEvent.aboutplace.price_type;
                                                    ePrice = bookedEvent.aboutplace.place_price;
                                                    let delta = timeDiffCalc(startTimestamp, endTimestamp);
                                                    if (eType == 'per_hour') {
                                                        eTime = delta.onlyhours + ' hours';
                                                        eTotalPrice = ePrice * delta.onlyhours;
                                                    }
                                                    if (eType == 'per_day' || eType == 'per_person') {
                                                        if (delta.hour >= 1) {
                                                            eTime = (delta.day + 1) + ' days'
                                                            eTotalPrice = ePrice * (delta.day + 1);
                                                        } else {
                                                            eTime = delta.day + ' days';
                                                            eTotalPrice = ePrice * delta.day;
                                                        }
                                                    }
                                                    if (eType == 'per_event') {
                                                        eTime = "--";
                                                        eTotalPrice = ePrice;
                                                    }

                                                }
                                            } else if (bookedEvent.personaldetail) {
                                                if (bookedEvent.personaldetail.price != '') {
                                                    eType = bookedEvent.personaldetail.price_type;
                                                    ePrice = bookedEvent.personaldetail.price;
                                                    let delta = timeDiffCalc(startTimestamp, endTimestamp);
                                                    if (eType == 'per_hour') {
                                                        eTime = delta.onlyhours + ' hours';
                                                        eTotalPrice = ePrice * delta.onlyhours;
                                                    }
                                                    if (eType == 'per_day' || eType == 'per_person') {
                                                        if (delta.hour >= 1) {
                                                            eTime = (delta.day + 1) + ' days'
                                                            eTotalPrice = ePrice * (delta.day + 1);
                                                        } else {
                                                            eTime = delta.day + ' days';
                                                            eTotalPrice = ePrice * delta.day;
                                                        }
                                                    }
                                                    if (eType == 'per_event') {
                                                        eTime = "--";
                                                        eTotalPrice = ePrice;
                                                    }
                                                }
                                            }
                                            const html = `<!DOCTYPE html>
                                                <html lang="en">
                                                <head>
                                                    <meta charset="UTF-8">
                                                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                                    <meta name="viewport" content="width=s, initial-scale=1.0">
                                                    <title>Invoice</title>
                                                    <style>
                                                        ul{
                                                            padding-left:0px;
                                                            padding:0 10px;
                                                        }
                                                        @media screen {
                                                            p.bodyText {font-family:verdana, arial, sans-serif;}
                                                        }
                                                        @media print {
                                                            p.bodyText {font-family:georgia, times, serif;}
                                                        }
                                                        @media screen, print {
                                                            p.bodyText {font-size:10pt}
                                                        }
                                                    </style>
                                                </head>
                                                <body>
                                                    <div style="width:100%; max-width: 1000px; margin: 0 auto; padding: 15px; background-color: #fcfcfc;">
                                                    <form action="#">
                                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; color: #4472C4;">
                                                        <div style="width: 80%;">
                                                            <h3 style="font-size: 12px; font-weight: 600; text-transform: capitalize;">FESTUM EVENTO PRIVATE LIMITED</h3>
                                                            <div style="font-size: 10px; font-weight: 600; text-transform: uppercase;">
                                                            <div style="display: flex; align-items: center;">
                                                                <span style="display: block; margin-bottom: 3px;">ADDRESS :</span>
                                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">593 South Marshall Drive Amarillo, TX 79106</span>
                                                            </div>
                                                            <div style="display: flex; align-items: center;">
                                                                <span style="display: block; margin-bottom: 3px;">CIN :</span>
                                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">L17110MH1973PLC019786</span>
                                                            </div>
                                                            <div style="display: flex; align-items: center;">
                                                                <span style="display: block; margin-bottom: 3px;">GSTIN :</span>
                                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">29GGGGG1314R9Z6</span>
                                                            </div>
                                                            <div style="display: flex; align-items: center;">
                                                                <span style="display: block; margin-bottom: 3px;">EMAIL :</span>
                                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">help@eventopackage.com</span>
                                                            </div>
                                                            </div>
                                                        </div>
                                                        <div style="width: 20%;">
                                                            <h3 style="font-size: 12px; font-weight: 600; text-transform: uppercase;">INVOICE</h3>
                                                            <div style="font-size: 9px; font-weight: 600; text-transform: uppercase;">
                                                            <span style="display: block; margin-bottom: 3px;">INVOICE NO. # ${body.invoice_no}</span>
                                                            <span style="display: block; margin-bottom: 3px;">INVOICE DATE : ${finalDate}</span>
                                                            </div>
                                                        </div>
                                                        </div>
                                                        <div style="width: 100%; margin-top: 50px; color: #ED7D59;">
                                                        <h3 style="font-size: 12px; font-weight: 600; text-transform: capitalize;">CLIENT DETAILS <span style="display: inline-block; margin-left: 10px; color: #363636;"></span></h3>
                                                        <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; padding-left: 20px;">
                                                            <div style="display: flex; align-items: center;">
                                                            <span style="display: block; margin-bottom: 3px;">Name :</span>
                                                            <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">${userdata.name}</span>
                                                            </div>
                                                            <div style="display: flex; align-items: center;">
                                                            <span style="display: block; margin-bottom: 3px;">ADDRESS :</span>
                                                            <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">656 South Marshall Drive Amarillo, TX 79106</span>
                                                            </div>
                                                            <div style="display: flex; align-items: center;">
                                                            <span style="display: block; margin-bottom: 3px;">GSTIN :</span>
                                                            <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">29GGGGG1314R9Z6</span>
                                                            </div>
                                                            <div style="display: flex; align-items: center;">
                                                            <span style="display: block; margin-bottom: 3px;">DATE & TIME :</span>
                                                            <div style="display: flex; align-items: baseline;">
                                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">${finalDate}</span>
                                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin:0px 5px; font-size: 15px;">|</span>
                                                                <span style="display: block; margin-bottom: 3px; color: #363636;">${ttinampm}</span>
                                                            </div>
                                                            </div>
                                                        </div>
                                                        </div>
                                                        <div style="width: 700px; margin: 0 auto; margin-top: 50px; ">
                                                        <table style="width: 100%; height: auto; border-collapse: collapse;">
                                                            <thead>
                                                            <tr style="text-align: left;">
                                                                <th style="padding: 10px; border: 1px solid #000; font-size: 12px; font-weight: 900; width: 50%;">DESCRIPTION</th>
                                                                <th style="padding: 10px; border: 1px solid #000; font-size: 12px; font-weight: 900; width: 10%;">RATE</th>
                                                                <th style="padding: 10px; border: 1px solid #000; font-size: 12px; font-weight: 900; width: 10%;">TIME</th>
                                                                <th style="padding: 10px; border: 1px solid #000; font-size: 12px; font-weight: 900; width: 10%;">QTY</th>
                                                                <th style="padding: 10px; border: 1px solid #000; font-size: 12px; font-weight: 900; width: 20%;">GROSS AMOUNT</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>  
                                                            <tr style="text-align: left;">
                                                                <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 50%;">${body.name}</td>
                                                                <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${parseFloat(ePrice).toFixed(2)} ${eType.trim().replace('_', ' ')}</td>
                                                                <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${eTime}</td>
                                                                <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;"> 1 </td>
                                                                <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 20%;">${parseFloat(eTotalPrice).toFixed(2)} </td>
                                                            </tr>
                                                            ${items} 
                                                            </tbody>
                                                        </table>
                                                        <table style="width: 100%; max-width: 300px; margin-left: auto; border-collapse: collapse; margin-top: 10px;">
                                                            <tbody>
                                                            <tr style="text-align: left;">
                                                                <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">SUB TOTAL</td>
                                                                <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">${parseFloat(body.subTotal).toFixed(2)}</td>
                                                            </tr>
                                                            <tr style="text-align: left;">
                                                                <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">DISCOUNT</td>
                                                                <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">${parseFloat(body.discountOnTotalBill).toFixed(2)}</td>
                                                            </tr>
                                                            <tr style="text-align: left;">
                                                                <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">GST AMOUNT</td>
                                                                <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">${body.GST ? parseFloat(body.GST).toFixed(2) : 0.00}</td>
                                                            </tr>
                                                            
                                                            <tr style="text-align: left;">
                                                                <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">NET AMOUNT</td>
                                                                <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">${parseFloat(body.totalPrice).toFixed(2)}</td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                        </div>
                                                        <div style="margin-top: 50px;">
                                                            <div style="display: flex; align-items: center;">
                                                                <span style="display: block; margin-bottom: 3px; font-size: 12px;">BANK DETAILS :</span>
                                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">Festum Evento Pvt.Ltd</span>
                                                            </div>
                                                            <div style="margin-top: 50px;">
                                                                <span style="display: block; margin-bottom: 5px; font-size: 12px;">TERMS AND CONDITION :</span>
                                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px; font-size:12px !important;">${bookedEvent.tandc.t_and_c}</span>
                                                            </div>
                                                        </div>
                                                        <h2 style="margin-top: 100px;">THANK YOU</h2>
                                                    </form>
                                                    </div>
                                                </body>
                                                </html>`;
                                                // <tr style="text-align: left;">
                                                //     <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">F-COIN</td>
                                                //     <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">${(body.fcoin) ? parseFloat(body.fcoin).toFixed(2) : 0.00}</td>
                                                // </tr>
                                            await page.setContent(html, { waitUntil: 'domcontentloaded' });
                                            await page.emulateMediaType('screen');
                                            const ext = 'pdf';
                                            const filename = 'invoice/DOC/' + req.token.userid + '/INV' + body.invoice_no + '.' + ext;
                                            const pdf = await page.pdf({
                                                path: 'invoice.pdf',
                                                printBackground: true,
                                                format: 'A4',
                                            });
                                            await browser.close();
                                            const pdffileBuffer = fs.readFileSync('invoice.pdf');
                                            if (pdffileBuffer) {
                                                awsCloud.saveToS3withFileName(pdffileBuffer, req.token.userid.toString(), 'application/pdf', filename).then((result) => {
                                                    let obj = {
                                                        s3Url: process.env.AWS_BUCKET_URI,
                                                        invoice: result.data.Key
                                                    };
                                                    body.invoice_url = obj.invoice;
                                                    primary.model(constants.MODELS.eventbookings, eventbookingModel).create(body).then((addedEventBokking) => {
                                                        let currentuserreview = primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({ userid: mongoose.Types.ObjectId(req.token.userid), eventid: mongoose.Types.ObjectId(addedEventBokking.eventId) }).sort({ _id: -1 }).lean();
                                                        addedEventBokking.isUserReview = (currentuserreview == null) ? false : true
                                                        return responseManager.onSuccess("Event booked successfully...", addedEventBokking, res);
                                                    }).catch((error) => {
                                                        return responseManager.onError(error, res);
                                                    });
                                                }).catch((error) => {
                                                    return responseManager.onError(error, res);
                                                })
                                            }
                                        })().catch((error) => {
                                            return responseManager.onError(error, res);
                                        });
                                    });
                                })().catch((error) => {
                                    return responseManager.onError(error, res);
                                });
                            });
                        });
                    });
                } else {
                    return responseManager.badrequest({ message: 'Invalid start or end date time to book event data, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid user id or event id to book event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid user id to book event data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to book event data, please try again' }, res);
    }
};
exports.calendar = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventId } = req.body;
            if (eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                let today = new Date();
                let i = 1;
                let finalObj = [];
                for (i = 1; i <= 182; i++) {
                    finalObj.push({
                        index: i,
                        day: today.getFullYear() + '-' + ((today.getMonth() + 1) < 10 ? '0' : '') + (today.getMonth() + 1) + '-' + (today.getDate() < 10 ? '0' : '') + today.getDate()
                    })
                    today.setDate(today.getDate() + 1);
                }
                let finalBookings = {};
                async.forEachSeries(finalObj, (day, next_day) => {
                    (async () => {
                        let start = new Date(day.day + ' 00:00:00').getTime() + 19800000;
                        let end = new Date(day.day + ' 23:59:00').getTime() + 19800000;
                        let bookings = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({
                            eventId: mongoose.Types.ObjectId(eventId),
                            $or: [
                                {
                                    $and: [
                                        { start_timestamp: { $gte: start } }, { start_timestamp: { $lte: end } },
                                        { end_timestamp: { $gte: start } }, { end_timestamp: { $lte: end } }
                                    ]
                                },
                                {
                                    start_timestamp: { $lte: start }, end_timestamp: { $gte: end }
                                },
                                {
                                    $and: [{ start_timestamp: { $gte: start } }, { start_timestamp: { $lte: end } }]
                                },
                                {
                                    $and: [{ end_timestamp: { $gte: start } }, { end_timestamp: { $lte: end } }]
                                }
                            ]
                        }).select("name start_time end_time start_date end_date start_timestamp end_timestamp").sort({ start_timestamp: 1 }).lean();
                        if (bookings && bookings.length > 0) {
                            let innerfinalBookings = [];
                            async.forEachSeries(bookings, (booking, next_booking) => {
                                if (start > booking.start_timestamp) {
                                    booking.start_time = '00:00';
                                }
                                if (end < booking.end_timestamp) {
                                    booking.end_time = '23:59';
                                }
                                delete booking.start_timestamp;
                                delete booking.end_timestamp;
                                innerfinalBookings.push(booking);
                                next_booking();
                            }, () => {
                                finalBookings[day.day] = innerfinalBookings;
                            });
                        } else {
                            finalBookings[day.day] = [];
                        }
                        next_day();
                    })().catch((error) => { });
                }, () => {
                    return responseManager.onSuccess('all bookings', finalBookings, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid user data to check event booking availability, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
    }
};
exports.checkavailability = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventId, start_date, end_date, start_time, end_time } = req.body;
            if (eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                if (start_date && end_date && start_time && end_time) {
                    let xstart_date = start_date.split("-");
                    let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + start_time).getTime() + 19800000;
                    let yend_date = end_date.split("-");
                    let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + end_time).getTime() + 19800000;
                    let newStartTimestamp = '';
                    let newEndTimestamp = '';
                    let event = await primary.model(constants.MODELS.events, eventModel).findOne({ _id: mongoose.Types.ObjectId(eventId) }).populate([
                        { path: "services", model: primary.model(constants.MODELS.services, serviceModel) },
                        { path: "items", model: primary.model(constants.MODELS.items, itemModel) },
                        { path: "equipments", model: primary.model(constants.MODELS.equipments, equipmentModel) },
                        { path: "discounts.services", model: primary.model(constants.MODELS.services, serviceModel) },
                        { path: "discounts.items", model: primary.model(constants.MODELS.items, itemModel) },
                        { path: "discounts.equipments", model: primary.model(constants.MODELS.equipments, equipmentModel) },
                    ]).sort({ start_timestamp: 1 }).lean();
                    if (event.event_type == 'have_you_places') {
                        newStartTimestamp = minusHours(startTimestamp, parseInt(event.aboutplace.clearing_time));
                        newEndTimestamp = addHours(endTimestamp, parseInt(event.aboutplace.clearing_time));
                    } else {
                        newStartTimestamp = minusHours(startTimestamp, parseInt(event.personaldetail.clearing_time));
                        newEndTimestamp = addHours(endTimestamp, parseInt(event.personaldetail.clearing_time));
                    }
                    let bookings = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({
                        eventId: event._id,
                        $or: [
                            {
                                $and: [
                                    { start_timestamp: { $gte: newStartTimestamp } }, { start_timestamp: { $lte: newEndTimestamp } },
                                    { end_timestamp: { $gte: newStartTimestamp } }, { end_timestamp: { $lte: newEndTimestamp } }
                                ]
                            },
                            {
                                start_timestamp: { $lte: newStartTimestamp }, end_timestamp: { $gte: newEndTimestamp }
                            },
                            {
                                $and: [{ start_timestamp: { $gte: newStartTimestamp } }, { start_timestamp: { $lte: newEndTimestamp } }]
                            },
                            {
                                $and: [{ end_timestamp: { $gte: newStartTimestamp } }, { end_timestamp: { $lte: newEndTimestamp } }]
                            }
                        ]
                    }).select("name start_time end_time start_date end_date").sort({ start_timestamp: 1 }).lean();
                    if (bookings && bookings.length > 0) {
                        return responseManager.onSuccess('This slot is not available.', 0, res)
                    } else {
                        let delta = timeDiffCalc(startTimestamp, endTimestamp);
                        async.forEachSeries(event.services, (service, next_service) => {
                            async.forEachSeries(event.discounts, (discount, next_discount) => {
                                let itemFinalPrice = 0;
                                if (service.price_type == 'per_day') {
                                    if (delta.hour >= 1) {
                                        itemFinalPrice += parseInt(service.price) * (delta.day + 1);
                                    } else {
                                        itemFinalPrice += parseInt(service.price) * delta.day;
                                    }
                                }
                                if (service.price_type == 'per_person' || service.price_type == 'per_event') {
                                    itemFinalPrice += parseInt(service.price);
                                }
                                service.itemFinalPrice = parseFloat(itemFinalPrice).toFixed(2);                                
                                if (discount.services.length > 0) {
                                    let itemDiscountPrice = 0;
                                    discount.services.forEach((element) => {
                                        if (element._id.toString() == service._id.toString()) {
                                            itemDiscountPrice += parseFloat(itemFinalPrice) - (parseFloat(itemFinalPrice) * parseFloat(discount.discount) / 100);
                                        }
                                    });
                                    service.itemDiscountPrice = parseFloat(itemDiscountPrice).toFixed(2);
                                }
                                next_discount();
                            });
                            next_service();

                        }, () => {
                            async.forEachSeries(event.items, (item, next_item) => {
                                async.forEachSeries(event.discounts, (discount, next_discount) => {
                                    let itemFinalPrice = 0;
                                    if (item.price_type == 'per_day') {
                                        if (delta.hour >= 1) {
                                            itemFinalPrice += parseInt(item.price) * (delta.day + 1);
                                        } else {
                                            itemFinalPrice += parseInt(item.price) * delta.day;
                                        }
                                    }
                                    if (item.price_type == 'per_person' || item.price_type == 'per_event') {
                                        itemFinalPrice += parseInt(item.price)
                                    }
                                    item.itemFinalPrice = parseFloat(itemFinalPrice).toFixed(2);
                                    if (discount.items.length > 0) {
                                        let itemDiscountPrice = 0;
                                        discount.items.forEach((element) => {
                                            if (element._id.toString() == item._id.toString()) {
                                                itemDiscountPrice += parseFloat(itemFinalPrice) - (parseFloat(itemFinalPrice) * parseFloat(discount.discount) / 100);
                                            }
                                        });
                                        item.itemDiscountPrice = parseFloat(itemDiscountPrice).toFixed(2);
                                    }
                                    next_discount();
                                });
                                next_item();
                            }, () => {
                                async.forEachSeries(event.equipments, (equipment, next_item) => {
                                    async.forEachSeries(event.discounts, (discount, next_discount) => {
                                        let itemFinalPrice = 0;
                                        if (equipment.price_type == 'per_day') {
                                            if (delta.hour >= 1) {
                                                itemFinalPrice += parseInt(equipment.price) * (delta.day + 1);
                                            } else {
                                                itemFinalPrice += parseInt(equipment.price) * delta.day;
                                            }
                                        }
                                        if (equipment.price_type == 'per_person' || equipment.price_type == 'per_event') {
                                            itemFinalPrice += parseInt(equipment.price);
                                        }
                                        equipment.itemFinalPrice = parseFloat(itemFinalPrice).toFixed(2);
                                        if (discount.equipments.length > 0) {
                                            let itemDiscountPrice = 0;
                                            discount.equipments.forEach((element) => {
                                                if (element._id.toString() == equipment._id.toString()) {
                                                    itemDiscountPrice += parseFloat(itemFinalPrice) - (parseFloat(itemFinalPrice) * parseFloat(discount.discount) / 100);

                                                }
                                            });
                                            equipment.itemDiscountPrice = parseFloat(itemDiscountPrice).toFixed(2);
                                        }
                                        next_discount();
                                    });
                                    next_item();
                                }, () => {
                                    (async () => {
                                        let FinalPrice = 0;
                                        if (event.aboutplace) {
                                            if (event.aboutplace.price_type == 'per_hour') {
                                                FinalPrice += event.aboutplace.place_price * delta.onlyhours;
                                            }
                                            if (event.aboutplace.price_type == 'per_day') {
                                                if (delta.hour >= 1) {
                                                    FinalPrice = event.aboutplace.place_price * (delta.day + 1);
                                                } else {
                                                    FinalPrice = event.aboutplace.place_price * delta.day;
                                                }
                                            }
                                            if (event.aboutplace.price_type == 'per_event') {
                                                FinalPrice = event.aboutplace.place_price;
                                            }
                                        } else if (event.personaldetail.price != '') {
                                            if (event.personaldetail.price_type == 'per_hour') {
                                                FinalPrice = event.personaldetail.price * delta.onlyhours;
                                            }
                                            if (event.personaldetail.price_type == 'per_day') {
                                                if (delta.hour >= 1 && delta.day == 0) {
                                                    FinalPrice = event.personaldetail.price * 1;
                                                } else {
                                                    FinalPrice = event.personaldetail.price * delta.day;
                                                }
                                            }
                                            if (event.personaldetail.price_type == 'per_event') {
                                                FinalPrice = event.personaldetail.price;
                                            }
                                        }
                                        // event.FinalPrice = parseFloat(FinalPrice).toFixed(2)
                                        return responseManager.onSuccess('Bookings available on the selected date and time.', { services: event.services, items: event.items, equipments: event.equipments, FinalPrice: FinalPrice }, res);
                                    })().catch((error) => {
                                        return responseManager.onError(error, res);
                                    });
                                });
                            });
                        });
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid event id to check event booking availability, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid user data to check event booking availability, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid token to check event booking availability, please try again' }, res);
        }
    }
};
exports.bookinglist = async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            let primary = mongoConnection.useDb(constants.DEFAULT_DB);
            let eventData = await primary.model(constants.MODELS.eventbookings, eventbookingModel).find({ userid: mongoose.Types.ObjectId(req.token.userid) }).sort({ _id: -1 }).lean();
            if (eventData && eventData != null) {
                let allEvents = [];
                async.forEachSeries(eventData, (event, next_event) => {
                    (async () => {
                        let currentuserreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({ userid: mongoose.Types.ObjectId(req.token.userid), eventid: mongoose.Types.ObjectId(event.eventId) }).sort({ _id: -1 }).lean();
                        event.isUserReview = (currentuserreview == null) ? false : true
                        allEvents.push(event);
                        next_event();
                    })().catch((error) => { });
                }, () => {
                    return responseManager.onSuccess('Booking list data!', allEvents, res);
                });
            } else {
                return responseManager.badrequest({ message: 'Invalid event id get event data, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid organizerid to get event discount details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get event data, please try again' }, res);
    }
};