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
    enqurymakerName: {
        type: String,
        required: true,
    },
    enqurymakerCity: {
        type: String,
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
    leadstatus: {
        type: Boolean,
        default: false
    },
    statusOfEnq: {
        type: String,
        default:"new"
    },
    followupStatus: {
        type: Boolean,
        default: false
    },
    followupDate: {
        type: Date,
        default : null
    },
});

module.exports = mongoose.model('Enquiries', EnquiriesSchema);
