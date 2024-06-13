const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RestaurantMenuImagesSchema = new Schema({
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
    },
    images: [
        {
            type: String,
            required: true,
        },
    ],
});

module.exports = mongoose.model('RestaurantMenuImages', RestaurantMenuImagesSchema);
