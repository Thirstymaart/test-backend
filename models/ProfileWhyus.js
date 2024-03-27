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
  },
  mainDescription: {
    type: String,
  },
  heading1: {
    type: String,
  },
  description1: {
    type: String,
  },
  heading2: {
    type: String,
  },
  description2: {
    type: String,
  },
  heading3: {
    type: String,
  },
  description3: {
    type: String,
  },
  heading4: {
    type: String,
  },
  description4: {
    type: String,
  },
 
  closingTitle: {
    type: String,
  },
  closingDescription: {
    type: String,
  },
  description: {
    type: String,
  },
 
});

module.exports = mongoose.model('ProfileWhyus', ProfileWhyus);
