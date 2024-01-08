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
    type: String,
  },
  //--------------------------------------------------------------------
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
  size: {
    type: String,
  },
  minqty: {
    type: String,
  },
  additionalinfo: {
    type: String,
  },
  //--------------------------------------------------------------------
  name1: {
    type: String,
  },
  description1: {
    type: String,
  },
  price1: {
    type: String,
  },
  image1: {
    type: String,
  },
  size1: {
    type: String,
  },
  minqty1: {
    type: String,
  },
  additionalinfo1: {
    type: String,
  },
  //--------------------------------------------------------------------
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
  size2: {
    type: String,
  },
  minqty2: {
    type: String,
  },
  additionalinfo2: {
    type: String,
  },
  //--------------------------------------------------------------------
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
  size3: {
    type: String,
  },
  minqty3: {
    type: String,
  },
  additionalinfo3: {
    type: String,
  },
});

module.exports = mongoose.model('Product', ProductSchema);

