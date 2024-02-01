let express = require("express");
let router = express.Router();
const helper = require('../../utilities/helper');
const listInvoiceCtrl = require('../../controllers/user/invoices/list');
const getoneInvoiceCtrl = require('../../controllers/user/invoices/getone');
router.post('/list', helper.authenticateToken, listInvoiceCtrl.withoutpagination);
router.post('/getone', helper.authenticateToken, getoneInvoiceCtrl.getoneinvoice);
module.exports = router;