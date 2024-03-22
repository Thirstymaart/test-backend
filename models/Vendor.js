// models/Vendor.js
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNo: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['Vendor'],
        default: 'Vendor',
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    companyName: {
        type: String,
    },
    gstNo: {
        type: String,
    },
    address: {
        type: String,
    },
    paymentid: {
        type: String,
    },
    validtill: {
        type: Date,
    },
    paymentDate: {
        type: Date,
    },
    payment: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: String,
    }

});

module.exports = mongoose.model('Vendor', vendorSchema);
