const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    categoryDesc: {
        type: String,
        required: true,
    },
    categoryDesc: {
        type: String,
        required: true,
    },
    categoryImage: {
        type: String,
        required: true,
    },
    categoryImageOutline: {
        type: String,
        required: true,
    },
    trendingStatus: {
        type: Boolean,
    },
    subCategories: {
        type: Array,
        required: true,
    },
});

module.exports = mongoose.model('Categories', categorySchema);
