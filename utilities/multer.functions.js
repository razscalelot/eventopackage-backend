let multer = require("multer");
let memoryStorage = multer.memoryStorage();
let memoryUpload = multer({ storage: memoryStorage });
module.exports = { memoryUpload };