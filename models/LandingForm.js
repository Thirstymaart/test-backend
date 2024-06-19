// models/Vendor.js
const mongoose = require('mongoose');

const LandingFormSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    gstn: {
        type: String,
    },
   

});

module.exports = mongoose.model('LandingForm', LandingFormSchema);
