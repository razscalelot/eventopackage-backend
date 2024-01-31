let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const listInvoicesCtrl = require('../../controllers/organizer/invoices/list');
const getoneInvoiceCtrl = require('../../controllers/organizer/invoices/getone');
router.post('/list', helper.authenticateToken, listInvoicesCtrl.withpagination);
router.post('/getone', helper.authenticateToken, getoneInvoiceCtrl.getoneinvoice);
module.exports = router;