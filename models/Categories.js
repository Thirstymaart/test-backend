const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    categoryImage: {
        type: String,
        required: true,
    },
    trendingStatus: {
        type: Boolean,
        required: true,
    },
    subCategories: {
        type: Array,
        required: true,
    },
});

module.exports = mongoose.model('Categories', categorySchema);
