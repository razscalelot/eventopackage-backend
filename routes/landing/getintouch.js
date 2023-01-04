let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const getintouchModel = require('../../models/getintouches.model');
const Sib = require('sib-api-v3-sdk');
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.SIB_API_KEY;
router.post('/', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { name, company_name, email, description } = req.body;
    if (name && name.trim() != '' && email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) && company_name && company_name.trim() != '' && description && description.trim() != '') {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let checkExisting = await primary.model(constants.MODELS.getintouches, getintouchModel).findOne({email: email}).lean();
        if (checkExisting == null) {
            let obj = {
                name: name,
                email: email,
                company_name: company_name,
                description: description,
            };
            await primary.model(constants.MODELS.getintouches, getintouchModel).create(obj);
            const tranEmailApi = new Sib.TransactionalEmailsApi()
            const sender = {
                email: email,
                name: name
            }
            const receivers = [
                {
                    email: 'raj.scalelot@gmail.com',
                    name: 'Raz Kalsariya'
                },
            ];
            tranEmailApi.sendTransacEmail({
                sender,
                to: receivers,
                subject: 'Testing API for Send In Blue',
                textContent: `testing testing Cules Coding will teach you how to become a developer.`,
                htmlContent: `<h1>`+company_name+`</h1><a href="https://scalelot.com/">Visit</a>`+ description,
                params: {
                    role: 'Backend',
                },
            }).then((response) => {
                console.log('success', response);
                return responseManager.onSuccess('Thank you for getting in touch. we will reply by email as soon as possible.', 1, res);
            }).catch((error) => {
                console.log('error', error);
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'User already send to query with same email, Please try again...' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid data to send query, please try again' }, res);
    }
});
module.exports = router;