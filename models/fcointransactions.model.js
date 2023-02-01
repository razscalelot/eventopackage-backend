let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
    receiver_id : {
        type: mongoose.Types.ObjectId,
		default: null
    },
    sender_id : {
        type: mongoose.Types.ObjectId,
		default: null
    },
    transaction_type : {
        type: String,
        enum: ['refer', 'transaction', 'redeem', 'invoice']
    },
    transaction_icon : {
        type: String,
        enum: ['global/tricons/refer.png','global/tricons/transaction.png','global/tricons/redeem.png','global/tricons/invoice.png']
    },
    f_coins : {
        type : Number,
        default: 0
    }
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;