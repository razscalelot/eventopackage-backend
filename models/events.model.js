let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let schema = new mongoose.Schema({
    capacity : {
        location: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: {
                type: [Number]
            }
        }
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
schema.index({ "capacity.location" : "2dsphere" });
module.exports = schema;