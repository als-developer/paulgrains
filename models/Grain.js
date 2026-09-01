const mongoose = require('mongoose');

const grainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['cereal', 'pulse', 'oilseed', 'other'],
    required: true
  },
  varieties: [{
    name: String,
    description: String
  }],
  averagePrice: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'ton', 'bushel'],
    default: 'kg'
  },
  imageUrl: String,
  description: String,
  season: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Grain', grainSchema);
