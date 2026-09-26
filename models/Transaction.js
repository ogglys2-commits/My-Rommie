const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  pairId: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  scope: {
    type: String,
    enum: ['Pareja', 'Individual'],
    default: 'Pareja'
  },
  week: {
    type: String,
    enum: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    default: 'Semana 1'
  },
  description: {
    type: String,
    required: true
  },
  rawAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['USD', 'BS'],
    default: 'USD'
  },
  amountUSD: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    default: 36.5
  },
  date: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: '📦 Otros'
  },
  image: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);