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
    validtill: {
        type: Date,
        default: Date.now,
        required: true,
    },
    payment: {
        type: Boolean,
        default:false
    },
   
});

module.exports = mongoose.model('Vendor', vendorSchema);
