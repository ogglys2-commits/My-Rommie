const mongoose = require('mongoose');

const PairSchema = new mongoose.Schema({
  pairId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  user1: {
    type: String,
    required: true,
    trim: true
  },
  user2: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pair', PairSchema);