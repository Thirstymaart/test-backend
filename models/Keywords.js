// models/keywordModel.js
const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  keywords: [
    {
      keyword: { type: String, required: true },
      searchVolume: { type: Number, required: true },
    },
  ],
  addDate: { type: Date, default: Date.now },
});

const Keyword = mongoose.model('Keywords', keywordSchema);

module.exports = Keyword;


