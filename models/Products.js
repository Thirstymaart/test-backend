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
  subcategory1: {
    type: Array,
    required: true,
  },
  name1: {
    type: String,
    required: true,
  },
  description1: {
    type: String,
    required: true,
  },
  price1: {
    type: String,
    required: true,
  },
  image1: {
    type: String,
    required: true,
  },
  //---------------------------------------------------------------------
  subcategory2: {
    type: String,
  },
  name2: {
    type: String,
  },
  description2: {
    type: String,
  },
  price2: {
    type: String,
  },
  image2: {
    type: String,
  },
  //---------------------------------------------------------------------
  subcategory3: {
    type: String,
  },
  name3: {
    type: String,
  },
  description3: {
    type: String,
  },
  price3: {
    type: String,
  },
  image3: {
    type: String,
  },
  //---------------------------------------------------------------------
  subcategory4: {
    type: String,
  },
  name4: {
    type: String,
  },
  description4: {
    type: String,
  },
  price4: {
    type: String,
  },
  image4: {
    type: String,
  },
});

module.exports = mongoose.model('Product', ProductSchema);

