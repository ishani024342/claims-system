const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  policyId: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);