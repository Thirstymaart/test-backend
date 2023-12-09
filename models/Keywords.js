const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
    keywordName: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
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
    validDate: {
        type: Date,
        required: true,
    },
});

// Set the validDate to one month after the addDate
keywordSchema.pre('save', function (next) {
    const oneMonthLater = new Date(this.addDate);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    this.validDate = oneMonthLater;
    next();
});

module.exports = mongoose.model('Keywords', keywordSchema);
