const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendorInfoSchema = new mongoose.Schema({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor', 
        required: true,
    },
    gstNo: {
        type: String,
        required: true,
    },
    panNo: {
        type: String,
        required: true,
    },
    category: {
        type: Array,
        required: true,
    },
    subCategory: {
        type: Array,
        required: true,
    },
    companyName: {
        type: String,
        required: true,
    },
    workingHour: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        required: true,
    },
    
});

const VendorInfo = mongoose.model('VendorInfo', vendorInfoSchema);

module.exports = VendorInfo;
