let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	name : {
		type: String,
		require: true
	},
	email: {
		type: String,
		require: true
	},
	phone_no: {
		type: String,
		require: true
	},
	address: {
		type: String,
		require: true
	},
	country_code: {
		type: String,
		require: true
	},
	password: {
		type: String,
		default: ''
	},
    refer_code:{
        type: String,
		default: ''
    },
    my_refer_code:{
        type: String,
		default: ''
    },
    fcm_token: {
        type: String,
		default: ''
    },
    status: {
        type: Boolean,
		default: false
    },
	createdBy: {
		type: mongoose.Types.ObjectId,
		default: null
	},
	updatedBy: {
		type: mongoose.Types.ObjectId,
		default: null
	}
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;