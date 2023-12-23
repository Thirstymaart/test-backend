const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
    keywords: {
        type: Array,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
        required: true,
    },
    categoryName: {
        type: String, // Add this field for the category name
        required: true,
    },
    subcategory: {
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

