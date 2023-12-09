const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    roles: [{
        type: String,
        required: true,
        enum: ['super_admin', 'admin', 'data_manager', ''],
    }],
});

const AdminModel = mongoose.model('Admin', adminSchema);

module.exports = AdminModel;