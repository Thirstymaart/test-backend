const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileHome = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor', 
    required: true,
  },
  banner: {
    type: Array,
    required: true,
  },
  banneralt: {
    type: Array,
    required: true,
  },
  homeintro: {
    type: String,
    required: true,
  },
  facebook: {
    type: String,
  },
  instagram: {
    type: String,
  },
  youtube: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  brochure: {
    type: String,
  },
});

module.exports = mongoose.model('Profilehome', ProfileHome);
