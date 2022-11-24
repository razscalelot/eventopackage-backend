let mongoose = require("mongoose");
let mongoosePaginate = require("mongoose-paginate-v2");
// let serviceSchema = new mongoose.Schema({
// 	name: { 
//         type: String,
// 		trim: true,
// 		required: true,
//     },
//     price: { 
//         type: String,
// 		trim: true,
// 		required: true,
//     },
//     price_type: { 
//         type: String,
// 		trim: true,
// 		required: true,
//     },
//     quantity: { 
//         type: String,
// 		default: ''
//     },
//     description: { 
//         type: String,
//         default: ''
//     }
// }, { _id: false });
let discountSchema = new mongoose.Schema({
	discountname: { 
        type: String,
		trim: true,
		required: true,
    },
    discounttype: { 
        type: String,
		trim: true,
		required: true,
    },
    description: { 
        type: String,
        default: ''
    },
    discount: { 
        type: String,
		trim: true,
		required: true,
    },
    tandc: { 
        type: String,
		default: ''
    },
    services:[]
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