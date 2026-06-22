const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  id:              { type: String, required: true, unique: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policyId:        { type: String, required: true },
  policyholderId:  { type: String, default: '' },   // denormalised for easy display
  amount:          { type: Number, required: true },
  reason:          { type: String, required: true },
  incidentDate:    { type: String, default: '' },
  status:          { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },

  // admin note when approving / rejecting
  adminNote:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);
