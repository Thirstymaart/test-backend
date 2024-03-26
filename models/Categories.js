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
    subCategories: [
        {
            subCategoryName: {
                type: String,
                required: true,
            },
            subCategoryDesc: {
                type: String,
                required: true,
            },
            subCategoryImage: {
                type: String,
                required: true,
            }
        }
    ]



});

module.exports = mongoose.model('Categories', categorySchema);
