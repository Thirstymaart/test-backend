const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
    keywords: {
        type: Array,
        required: true,
    },
    categoryName: {
        type: String,
        required: true,
    },
    addDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

module.exports = mongoose.model('Keywords', keywordSchema);

