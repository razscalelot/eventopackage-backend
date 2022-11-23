let mongoose = require('mongoose');
let mongoDB = mongoose.createConnection(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
module.exports = mongoDB;