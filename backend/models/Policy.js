const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  policyholderId: { type: String, required: true },
  type: { type: String, required: true },
  coverageAmount: { type: Number, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);