const mongoose = require('mongoose');

/**
 * Policy — a real insurance policy owned by a user.
 * Created either manually (old flow) or via /apply/:planId (new flow).
 */
const policySchema = new mongoose.Schema({
  id:             { type: String, required: true, unique: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policyholderId: { type: String, required: true },
  type:           { type: String, required: true },
  coverageAmount: { type: Number, required: true },
  premium:        { type: Number, default: 0 },
  startDate:      { type: String, required: true },
  endDate:        { type: String, required: true },

  // New fields (apply flow)
  planId:         { type: mongoose.Schema.Types.ObjectId, ref: 'PolicyPlan', default: null },
  planName:       { type: String, default: '' },
  status:         { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
