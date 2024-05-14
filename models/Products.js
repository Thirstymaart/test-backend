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
  isCategory: {
    type: Boolean,
    default: false,
  },
  categoryId: {
    type: String,
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
  size: {
    type: String,
  },
  minqty: {
    type: String,
  },
  additionalinfo: {
    type: String,
  },
  featured: {
    type: Boolean,
    default: false,
  },
});

ProductSchema.pre('save', async function () {
  if (this.isModified('featured') && this.featured) {
    const featuredProductsCount = await this.model('Product').countDocuments({
      vendor: this.vendor,
      featured: true,
    });
    if (featuredProductsCount >= 4) {
      throw new Error('Maximum number of featured products per vendor reached');
    }
  }
});

module.exports = mongoose.model('Product', ProductSchema);

