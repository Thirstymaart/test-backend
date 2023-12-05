const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductClickSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor', // Reference to the vendor who registered the product
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Reference to the Product model
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  shareClick: {
    type: Number,
    default: 0,
  },
  whatsappClick: {
    type: Number,
    default: 0,
  },
  callClick: {
    type: Number,
    default: 0,
  },
  profileClick: {
    type: Number,
    default: 0,
  },
  enquireClick: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('ProductClick', ProductClickSchema);
