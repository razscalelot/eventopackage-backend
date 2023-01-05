let response = require('./response.manager');
let jwt = require("jsonwebtoken");
var CryptoJS = require("crypto-js");
const allowedContentTypes = require("./content-types").allowedContentTypes;
exports.makeid = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
exports.getFileType = (mimeType) => {
    let filteredData = allowedContentTypes.filter((element) => {
        return element.mimeType == mimeType;
    });
    return filteredData.length > 0 ? filteredData[0].fName : "";
};
exports.generateAccessToken = async (userData) => {
    return jwt.sign(userData, process.env.APP_LOGIN_AUTH_TOKEN, {});
};
exports.authenticateToken = async (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const token = bearer[1];
        jwt.verify(token, process.env.APP_LOGIN_AUTH_TOKEN, (err, auth) => {
            if (err) {
                return response.unauthorisedRequest(res);
            } else {
                req.token = auth;
            }
        });
        next();
    } else {
        return response.unauthorisedRequest(res);
    }
};
exports.passwordDecryptor = async (passwordKeyDecrypt) => {
    try {
        var decLayer1 = CryptoJS.TripleDES.decrypt(passwordKeyDecrypt, process.env.PASSWORD_ENCRYPTION_SECRET);
        var deciphertext1 = decLayer1.toString(CryptoJS.enc.Utf8);
        var decLayer2 = CryptoJS.DES.decrypt(deciphertext1, process.env.PASSWORD_ENCRYPTION_SECRET);
        var deciphertext2 = decLayer2.toString(CryptoJS.enc.Utf8);
        var decLayer3 = CryptoJS.AES.decrypt(deciphertext2, process.env.PASSWORD_ENCRYPTION_SECRET);
        var finalDecPassword = decLayer3.toString(CryptoJS.enc.Utf8);
        return finalDecPassword;
    } catch (err) {
        throw err;
    }
};
exports.passwordEncryptor = async (passwordKeyEncrypt) => {
    try {
        var encLayer1 = CryptoJS.AES.encrypt(passwordKeyEncrypt, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
        var encLayer2 = CryptoJS.DES.encrypt(encLayer1, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
        var finalEncPassword = CryptoJS.TripleDES.encrypt(encLayer2, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
        return finalEncPassword;
    } catch (err) {
        throw err;
    }
};
exports.getInvoiceNo = (invno) => {
    var inv_number = invno + 1;
    var lengoftemp = inv_number.toString().length;
    if(lengoftemp == 1){
        inv_number = '0000000'+inv_number;
    }else if(lengoftemp == 2){
        inv_number = '000000'+inv_number;
    }else if(lengoftemp == 3){
        inv_number = '00000'+inv_number;
    }else if(lengoftemp == 4){
        inv_number = '0000'+inv_number;
    }else if(lengoftemp == 5){
        inv_number = '000'+inv_number;
    }else if(lengoftemp == 6){
        inv_number = '00'+inv_number;
    }else if(lengoftemp == 7){
        inv_number = '0'+inv_number;
    }
    return inv_number;
};