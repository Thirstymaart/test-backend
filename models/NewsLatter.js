const mongoose = require('mongoose');

const newsLatterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
});

module.exports = mongoose.model('newsLatter', newsLatterSchema);
