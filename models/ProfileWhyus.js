const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileWhyus = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor', 
    required: true,
  },
  mainHeading: {
    type: String,
    required: true,
  },
  mainDescription: {
    type: String,
    required: true,
  },
  heading1: {
    type: String,
    required: true, 
  },
  description1: {
    type: String,
    required: true,
  },
  heading2: {
    type: String,
    required: true, 
  },
  description2: {
    type: String,
    required: true,
  },
  heading3: {
    type: String,
    required: true, 
  },
  description3: {
    type: String,
    required: true,
  },
  heading4: {
    type: String,
    required: true, 
  },
  description4: {
    type: String,
    required: true,
  },
 
  closingTitle: {
    type: String,
    required: true, 
  },
  closingDescription: {
    type: String,
    required: true,
  },
 
});

module.exports = mongoose.model('ProfileWhyus', ProfileWhyus);
