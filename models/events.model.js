let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
let discountSchema = new mongoose.Schema({
    sid: {
		type: mongoose.Types.ObjectId,
        trim: true,
		required: false,
	},
    isAdded: { 
        type: Boolean,
		required: false,
        default: false
    },
	discountname: { 
        type: String,
		trim: true,
		required: false,
    },
    discounttype: { 
        type: String,
		trim: true,
		required: false,
    },
    description: { 
        type: String,
        default: '',
		required: false,
    },
    discount: { 
        type: String,
		trim: true,
		required: false,
    },
    tandc: { 
        type: String,
		default: ''
    },
    services:[],
    items:[],
    equipments:[],
}, { _id: false });
let schema = new mongoose.Schema({
    event_category : {
        type: mongoose.Types.ObjectId,
		default: null
    },
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
    discounts : [discountSchema],
    services:[],
    items:[],
    equipments:[],
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