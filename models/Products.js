const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor', // Reference to the vendor who registered the product
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  subType: {
    type: String,
    required: true,
  },
  category: {
    type: Array,
    required: true,
  },
  //--------------------------------------------------------------------
  subcategory: {
    type: Array,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Product', ProductSchema);

