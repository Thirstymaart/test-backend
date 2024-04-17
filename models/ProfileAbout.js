const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileAbout = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor', 
    required: true,
  },
  aboutinto: {
    type: String,
    required: true,
  },
  vision: {
    type: String,
    required: true,
  },
  mission: {
    type: String,
    required: true, 
  },
  value: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  productdescription: {
    type: String,
  },
 
});

module.exports = mongoose.model('ProfileAbout', ProfileAbout);
