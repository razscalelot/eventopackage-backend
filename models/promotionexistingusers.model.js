let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
	notificationid: {
		type: mongoose.Types.ObjectId,
		require: true
	},
    organizers : [],
    users : []
}, { timestamps: true, strict: false, autoIndex: true });
schema.plugin(mongoosePaginate);
module.exports = schema;