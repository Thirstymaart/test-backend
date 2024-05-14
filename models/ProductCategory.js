const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productsCategorySchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor', // Reference to the vendor who registered the product
    required: true,
  },
  isCategory:{
    type: Boolean,
    default: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
  categoryDesc: {
    type: String,
    required: true,
  },
  products: [{
     type: Schema.Types.ObjectId, 
     ref: 'Product' 
    }]

});

module.exports = mongoose.model('productsCategory', productsCategorySchema)