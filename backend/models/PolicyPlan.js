const mongoose = require('mongoose');

/**
 * PolicyPlan — a plan template created by admin.
 * Users browse these and "apply" to get a real Policy.
 *
 * Example: "Health Shield Basic" — HEALTH, ₹5,00,000 coverage, ₹12,000/yr premium
 */
const policyPlanSchema = new mongoose.Schema({
  name:            { type: String, required: true },           // "Health Shield Basic"
  type:            { type: String, required: true,
                     enum: ['HEALTH', 'AUTO', 'HOME', 'LIFE', 'TRAVEL'] },
  coverageAmount:  { type: Number, required: true },           // 500000
  premium:         { type: Number, required: true },           // 12000 per year
  durationMonths:  { type: Number, required: true },           // 12 (policy lasts 12 months)
  description:     { type: String, required: true },           // short marketing blurb
  features:        [{ type: String }],                         // ["Cashless hospitalisation", ...]
  isActive:        { type: Boolean, default: true },           // admin can disable a plan
}, { timestamps: true });

module.exports = mongoose.model('PolicyPlan', policyPlanSchema);
