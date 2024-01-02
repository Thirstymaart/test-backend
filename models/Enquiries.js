const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EnquiriesSchema = new Schema({
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
    },
    enqurymaker: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    phonenumber: {
        type: String,
        required: true,
    },
    productname: {
        type: String,
        required: true,
    },
    productid: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    companyname: {
        type: String,
    },
});

module.exports = mongoose.model('Enquiries', EnquiriesSchema);
