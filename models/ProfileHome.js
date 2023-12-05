const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileHome = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor', // Reference to the vendor who registered the product
    required: true,
  },
  banner: {
    type: String,
    required: true,
  },
  banneralt: {
    type: String,
    required: true,
  },
  serviceAria: {
    type: String,
    required: true,
  },
  nature: {
    type: String,
    required: true,
  },
  homeintro: {
    type: String,
    required: true,
  },
  yearofestablishment: {
    type: Date,
    required: true,
  }
});

module.exports = mongoose.model('Profilehome', ProfileHome);
