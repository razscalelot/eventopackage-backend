const mongoConnection = require('../../../utilities/connections');
const responseManager = require('../../../utilities/response.manager');
const constants = require('../../../utilities/constants');
const helper = require('../../../utilities/helper');
const userModel = require('../../../models/users.model');
const eventbookingModel = require('../../../models/eventbookings.model');
const eventModel = require('../../../models/events.model');
const eventreviewModel = require('../../../models/eventreviews.model');
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

function itemsDetails(services, items){
    console.log("in fun services", services);
    console.log("in fun items", items);
    async.forEachSeries(services, (service, next_item) => {
        console.log("in forEachSeries service", service);
        let FinalPrice = 0;
        let time = '';
        if (service.price_type == 'per_hour') {
            time = delta.onlyhours + ' hours';
            FinalPrice = service.price * delta.onlyhours;
        }
        if (service.price_type == 'per_day') {
            if (delta.hour >= 1) {
                time = (delta.day + 1) + ' days';
                FinalPrice = service.price * (delta.day + 1);
            } else {
                time = delta.day + ' days';
                FinalPrice = service.price * delta.day;
            }
        }
        if (service.price_type == 'per_event') {
            time = "--";
            FinalPrice = service.price;
        }
        items += `<tr style="text-align: left;">
                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 50%;">${service.name}</td>
                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${service.price}  ${service.price_type.trim().replace('_', ' ')}</td>
                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${time}</td>
                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${service.itemCount}</td>
                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 20%;">${FinalPrice * service.itemCount}</td>
                </tr>`;
        next_item();
    });
    return items;
}


exports.booking = async (req, res) => {
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { user, eventId, trans_Id, price_type, name, event_type, url, category_name, address, payment_status, selectedItems, selectedEquipments, selectedServices, totalPrice, start_date, end_date, start_time, end_time } = req.body;
            if (user && user != '' && mongoose.Types.ObjectId.isValid(user) && eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                if (start_date && end_date && start_time && end_time) {
                    let totalInvoice = parseInt(await primary.model(constants.MODELS.eventbookings, eventbookingModel).countDocuments({}));
                    let invoiceNo = helper.getInvoiceNo(totalInvoice);
                    let finalItems = [];
                    let finalEquipments = [];
                    let finalServices = [];
                    async.forEachSeries(selectedItems, (item, next_item) => {
                        if (item._id && item._id != '' && mongoose.Types.ObjectId.isValid(item._id)) {
                            item._id = mongoose.Types.ObjectId(item._id);
                            finalItems.push(item);
                        }
                        next_item();
                    }, () => {
                        async.forEachSeries(selectedEquipments, (equipment, next_equipment) => {
                            if (equipment._id && equipment._id != '' && mongoose.Types.ObjectId.isValid(equipment._id)) {
                                equipment._id = mongoose.Types.ObjectId(equipment._id);
                                finalEquipments.push(equipment);
                            }
                            next_equipment();
                        }, () => {
                            async.forEachSeries(selectedServices, (service, next_service) => {
                                if (service._id && service._id != '' && mongoose.Types.ObjectId.isValid(service._id)) {
                                    service._id = mongoose.Types.ObjectId(service._id);
                                    finalServices.push(service);
                                }
                                next_service();
                            }, () => {
                                (async () => {
                                    let xstart_date = start_date.split("-");
                                    let startTimestamp = new Date(xstart_date[1] + '-' + xstart_date[2] + '-' + xstart_date[0] + ' ' + start_time).getTime();
                                    let yend_date = end_date.split("-");
                                    let endTimestamp = new Date(yend_date[1] + '-' + yend_date[2] + '-' + yend_date[0] + ' ' + end_time).getTime();
                                    let obj = {
                                        userid: mongoose.Types.ObjectId(user),
                                        eventId: mongoose.Types.ObjectId(eventId),
                                        trans_Id: trans_Id,
                                        price_type: price_type,
                                        name: name,
                                        event_type: event_type,
                                        url: url,
                                        invoice_no: invoiceNo,
                                        category_name: category_name,
                                        address: address,
                                        payment_status: payment_status,
                                        selectedItems: finalItems,
                                        selectedEquipments: finalEquipments,
                                        selectedServices: finalServices,
                                        totalPrice: parseFloat(totalPrice),
                                        start_date: start_date,
                                        end_date: end_date,
                                        start_time: start_time,
                                        end_time: end_time,
                                        isUserReview: false,
                                        start_timestamp: startTimestamp,
                                        end_timestamp: endTimestamp,
                                        created_at: Date.now(),
                                        updated_at: Date.now()
                                    };
                                    let output = await primary.model(constants.MODELS.eventbookings, eventbookingModel).create(obj);
                                    let currentuserreview = await primary.model(constants.MODELS.eventreviews, eventreviewModel).findOne({ userid: mongoose.Types.ObjectId(req.token.userid), eventid: mongoose.Types.ObjectId(output.eventId) }).sort({ _id: -1 }).lean();
                                    output.isUserReview = (currentuserreview == null) ? false : true
                                    let lastCreatedbooking = await primary.model(constants.MODELS.eventbookings, eventbookingModel).findById(output._id).populate({
                                        path: 'userid',
                                        model: primary.model(constants.MODELS.users, userModel),
                                        select: 'name email address'
                                    }).lean();
                                    let bookedEvent = await primary.model(constants.MODELS.events, eventModel).findOne({ _id: mongoose.Types.ObjectId(lastCreatedbooking.eventId) }).lean();
                                    let ePrice = 0;
                                    let eType = '';
                                    if (bookedEvent.aboutplace) {
                                        if (bookedEvent.aboutplace.place_price != '') {
                                            ePrice = bookedEvent.aboutplace.place_price;
                                            eType = bookedEvent.aboutplace.price_type;
                                        }
                                    } else if (bookedEvent.personaldetail) {
                                        if (bookedEvent.personaldetail.price != '') {
                                            ePrice = bookedEvent.personaldetail.price;
                                            eType = bookedEvent.personaldetail.price_type;
                                        }
                                    }
                                    let d = new Date(lastCreatedbooking.createdAt);
                                    let day = d.getDate();
                                    let month = d.getMonth();
                                    let year = d.getFullYear();
                                    const allmonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    let finalDate = day + ' ' + allmonth[month] + ' ' + year;
                                    let delta = timeDiffCalc(startTimestamp, endTimestamp);
                                    console.log("delta", delta);
                                    let items = '';
                                    if (lastCreatedbooking.selectedItems.length > 0) {
                                        items = itemsDetails(lastCreatedbooking.selectedItems, items);
                                    }
                                    if (lastCreatedbooking.selectedEquipments.length > 0) {
                                        items = itemsDetails(lastCreatedbooking.selectedEquipments, items);
                                    }
                                    if (lastCreatedbooking.selectedServices.length > 0) {
                                        items = itemsDetails(lastCreatedbooking.selectedEquipments, items);
                                    }
                                    const browser = await puppeteer.launch({
                                        executablePath: '/usr/bin/chromium-browser',
                                        args: ["--no-sandbox"]
                                    });
                                    const page = await browser.newPage();
                                    let pTime = '';
                                    let eTotalPrice = 0;
                                    if (price_type == 'per_hour') {
                                        pTime = delta.onlyhours + ' hours';
                                        eTotalPrice = ePrice * delta.onlyhours;
                                    }
                                    if (price_type == 'per_day') {
                                        if (delta.hour >= 1) {
                                            pTime = (delta.day + 1) + ' days';
                                            eTotalPrice = ePrice * (delta.day + 1);
                                        } else {
                                            pTime = delta.day + ' days';
                                            eTotalPrice = ePrice * delta.day;
                                        }
                                    }
                                    if (price_type == 'per_event') {
                                        pTime = "--";
                                        eTotalPrice = ePrice;
                                    }
                                    const html = `<!DOCTYPE html>
                                    <html lang="en">
                                    <head>
                                      <meta charset="UTF-8">
                                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                      <meta name="viewport" content="width=s, initial-scale=1.0">
                                      <title>Invoice</title>
                                      <style>
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
                                              <h3 style="font-size: 12px; font-weight: 600; text-transform: capitalize;">EVENTO PACKAGE</h3>
                                              <div style="font-size: 10px; font-weight: 600; text-transform: uppercase;">
                                                <div style="display: flex; align-items: center;">
                                                  <span style="display: block; margin-bottom: 3px;">ADDRESS :</span>
                                                  <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">123, vishvas nagar, nagalend, russia</span>
                                                </div>
                                                <div style="display: flex; align-items: center;">
                                                  <span style="display: block; margin-bottom: 3px;">CIN :</span>
                                                  <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">054054054056</span>
                                                </div>
                                                <div style="display: flex; align-items: center;">
                                                  <span style="display: block; margin-bottom: 3px;">GSTIN :</span>
                                                  <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">000022221111</span>
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
                                                <span style="display: block; margin-bottom: 3px;">INVOICE NO. # ${lastCreatedbooking.invoice_no}</span>
                                                <span style="display: block; margin-bottom: 3px;">INVOICE DATE : ${finalDate}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div style="width: 100%; margin-top: 50px; color: #ED7D59;">
                                            <h3 style="font-size: 12px; font-weight: 600; text-transform: capitalize;">CLIENT DETAILS : <span style="display: inline-block; margin-left: 10px; color: #363636;">5212265</span></h3>
                                            <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; padding-left: 20px;">
                                              <div style="display: flex; align-items: center;">
                                                <span style="display: block; margin-bottom: 3px;">Name :</span>
                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">${lastCreatedbooking.userid.name}</span>
                                              </div>
                                              <div style="display: flex; align-items: center;">
                                                <span style="display: block; margin-bottom: 3px;">ADDRESS :</span>
                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">${lastCreatedbooking.userid.address}</span>
                                              </div>
                                              <div style="display: flex; align-items: center;">
                                                <span style="display: block; margin-bottom: 3px;">GSTIN :</span>
                                                <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">2512365489321</span>
                                              </div>
                                              <div style="display: flex; align-items: center;">
                                                <span style="display: block; margin-bottom: 3px;">DATE & TIME :</span>
                                                <div style="display: flex; align-items: baseline;">
                                                  <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">02/02/2023</span>
                                                  <span style="display: block; margin-bottom: 3px; color: #363636; margin:0px 5px; font-size: 15px;">|</span>
                                                  <span style="display: block; margin-bottom: 3px; color: #363636;">10:55AM</span>
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
                                                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 50%;">${name}</td>
                                                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${ePrice} ${eType.trim().replace('_', ' ')}</td>
                                                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;">${pTime}</td>
                                                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 10%;"> 1 </td>
                                                    <td style="padding: 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 20%;">${eTotalPrice} </td>
                                                </tr>
                                              ${items} 
                                              </tbody>
                                            </table>
                                            <table style="width: 100%; max-width: 300px; margin-left: auto; border-collapse: collapse; margin-top: 10px;">
                                              <tbody>
                                                <tr style="text-align: left;">
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">SUB TOTAL</td>
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">125236</td>
                                                </tr>
                                                <tr style="text-align: left;">
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">DISCOUNT</td>
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">125236</td>
                                                </tr>
                                                <tr style="text-align: left;">
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">F-COIN</td>
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">125236</td>
                                                </tr>
                                                <tr style="text-align: left;">
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">GST AMOUNT</td>
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">125236</td>
                                                </tr>
                                                <tr style="text-align: left;">
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #000; font-weight: 900; width: 45%;">NET AMOUNT</td>
                                                  <td style="padding: 5px 10px; border: 1px solid #363636; font-size: 12px; color: #363636; font-weight: 900; width: 55%;">125236</td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                          <div style="margin-top: 50px;">
                                            <div style="display: flex; align-items: center;">
                                              <span style="display: block; margin-bottom: 3px; font-size: 12px;">BANK DETAILS :</span>
                                              <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">sagar khani pvt.ltd</span>
                                            </div>
                                            <div style="display: flex; align-items: center; margin-top: 50px;">
                                              <span style="display: block; margin-bottom: 3px; font-size: 12px;">TERMS AND CONDITION :</span>
                                              <span style="display: block; margin-bottom: 3px; color: #363636; margin-left: 10px;">sagar khani pvt.ltd</span>
                                            </div>
                                          </div>
                                          <h2 style="margin-top: 100px;">THANK YOU</h2>
                                        </form>
                                      </div>
                                    </body>
                                    </html>`;
                                    await page.setContent(html, { waitUntil: 'domcontentloaded' });
                                    await page.emulateMediaType('screen');
                                    const ext = 'pdf';
                                    const filename = 'invoice/DOC/' + req.token.userid + '/INV' + invoiceNo + '.' + ext;
                                    const pdf = await page.pdf({
                                        path: 'invoice.pdf',
                                        // margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
                                        printBackground: true,
                                        format: 'A4',
                                    });
                                    console.log("285", pdf);
                                    let fileBuffre = fs.readFileSync('invoice.pdf');
                                    awsCloud.saveToS3withFileName(fileBuffre, eventId, 'application/pdf', filename).then((result) => {
                                        let obj = {
                                            s3_url: process.env.AWS_BUCKET_URI,
                                            url: result.data.Key
                                        };
                                        primary.model(constants.MODELS.eventbookings, eventbookingModel).findByIdAndUpdate(output._id, { invoice_url: result.data.Key }).then((updateResult) => {
                                            primary.model(constants.MODELS.eventbookings, eventbookingModel).findById(output._id).then((resultx) => {
                                                return responseManager.onSuccess('Booking successfully... Donwload the Invoice !', resultx, res);
                                            }).catch((error) => {
                                                return responseManager.onError(error, res);
                                            });

                                        }).catch((error) => {
                                            console.log("293", error);
                                            return responseManager.onError(error, res);
                                        });
                                    }).catch((error) => {
                                        console.log("297", error);
                                        return responseManager.onError(error, res);
                                    });
                                    await browser.close();

                                    // return responseManager.onSuccess('Event Book successfully!', output, res);
                                })().catch((error) => {
                                    console.log("333", error);
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
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.status == true && userdata.mobileverified == true) {
            const { eventId } = req.body;
            if (eventId && eventId != '' && mongoose.Types.ObjectId.isValid(eventId)) {
                let today = new Date();
                let i = 1;
                let finalObj = [];
                for (i = 1; i <= 365; i++) {
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
                        }).select("name start_time end_time start_date end_date").sort({ start_timestamp: 1 }).lean();
                        if (bookings && bookings.length > 0) {
                            finalBookings[day.day] = bookings;
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
                    let event = await primary.model(constants.MODELS.events, eventModel).findOne({ _id: mongoose.Types.ObjectId(eventId) }).sort({ start_timestamp: 1 }).lean();
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
                        let FinalPrice = 0;
                        if (event.aboutplace) {
                            if (event.aboutplace.price_type == 'per_hour') {
                                FinalPrice = event.aboutplace.place_price * delta.hour;
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
                        } else {
                            if (event.personaldetail.price_type == 'per_hour') {
                                FinalPrice = event.personaldetail.price * delta.hour;
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
                        return responseManager.onSuccess('Bookings available on the selected date and time.', { FinalPrice: parseFloat(FinalPrice).toFixed(2) }, res);
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