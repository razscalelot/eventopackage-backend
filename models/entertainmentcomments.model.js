let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
    entertainment_id : {
        type: mongoose.Types.ObjectId,
        require : true
    },
    entertainment_url : {
        type : String,
        require : true
    },
    comment : {
        type : String,
        require : true
    },
    user_id : {
        type: mongoose.Types.ObjectId,
        require : true
    }
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;