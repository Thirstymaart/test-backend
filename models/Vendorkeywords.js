const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendorkeywordSchema = new mongoose.Schema({
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor', 
        required: true,
      },
    keywords: {
        type: Array,
        required: true,
    },
    addDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

module.exports = mongoose.model('Vendorkeywords', vendorkeywordSchema);

