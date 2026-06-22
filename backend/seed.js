require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Policyholder = require('./models/Policyholder');
const Policy = require('./models/Policy');
const Claim = require('./models/Claim');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  // ── Get existing users FIRST (before deleting anything) ────
  const jay   = await User.findOne({ username: 'jay' });
  const sarah = await User.findOne({ username: 'sarah' });

  if (!jay || !sarah) {
    console.log('❌ Please register "jay" and "sarah" first! Nothing was deleted.');
    process.exit(1);
  }

  // Only clear data AFTER confirming users exist
  await Policyholder.deleteMany({});
  await Policy.deleteMany({});
  await Claim.deleteMany({});
  console.log('Cleared existing policyholders/policies/claims...');

  // ── POLICYHOLDERS ──────────────────────────────────────────
  const policyholders = await Policyholder.insertMany([
    { id: 'PH001', userId: jay._id,   name: 'Jay Dubey',          email: 'jay@example.com',        phone: '9876543210' },
    { id: 'PH002', userId: jay._id,   name: 'Jay Dubey (Spouse)', email: 'jaydubey2@example.com',  phone: '9876543211' },
    { id: 'PH003', userId: sarah._id, name: 'Sarah Singh',        email: 'sarah@example.com',       phone: '9876543212' },
    { id: 'PH004', userId: sarah._id, name: 'Sarah Singh (Parent)', email: 'sarah2@example.com',   phone: '9876543213' },
  ]);
  console.log(`Created ${policyholders.length} policyholders...`);

  // ── POLICIES ───────────────────────────────────────────────
  const policies = await Policy.insertMany([
    { id: 'POL001', userId: jay._id,   policyholderId: 'PH001', type: 'HEALTH', coverageAmount: 500000,  premium: 12000, startDate: '2026-01-01', endDate: '2027-01-01', status: 'ACTIVE' },
    { id: 'POL002', userId: jay._id,   policyholderId: 'PH001', type: 'LIFE',   coverageAmount: 1000000, premium: 20000, startDate: '2025-06-01', endDate: '2035-06-01', status: 'ACTIVE' },
    { id: 'POL003', userId: jay._id,   policyholderId: 'PH002', type: 'HEALTH', coverageAmount: 300000,  premium: 8000,  startDate: '2026-01-01', endDate: '2027-01-01', status: 'ACTIVE' },
    { id: 'POL004', userId: sarah._id, policyholderId: 'PH003', type: 'HEALTH', coverageAmount: 750000,  premium: 15000, startDate: '2026-03-01', endDate: '2027-03-01', status: 'ACTIVE' },
    { id: 'POL005', userId: sarah._id, policyholderId: 'PH003', type: 'AUTO',   coverageAmount: 200000,  premium: 6000,  startDate: '2026-01-15', endDate: '2027-01-15', status: 'ACTIVE' },
    { id: 'POL006', userId: sarah._id, policyholderId: 'PH004', type: 'HEALTH', coverageAmount: 400000,  premium: 9000,  startDate: '2025-11-01', endDate: '2026-11-01', status: 'ACTIVE' },
  ]);
  console.log(`Created ${policies.length} policies...`);

  // ── CLAIMS ─────────────────────────────────────────────────
  const claims = await Claim.insertMany([
    { id: 'CLM001', userId: jay._id,   policyId: 'POL001', policyholderId: 'PH001', amount: 25000, reason: 'Hospitalization - Appendix Surgery', status: 'Approved' },
    { id: 'CLM002', userId: jay._id,   policyId: 'POL001', policyholderId: 'PH001', amount: 8000,  reason: 'Outpatient - Fever and Diagnosis',     status: 'Approved' },
    { id: 'CLM003', userId: jay._id,   policyId: 'POL001', policyholderId: 'PH001', amount: 15000, reason: 'Emergency - Fracture Treatment',        status: 'Pending'  },
    { id: 'CLM004', userId: jay._id,   policyId: 'POL002', policyholderId: 'PH001', amount: 50000, reason: 'Critical Illness Rider Claim',          status: 'Rejected' },
    { id: 'CLM005', userId: jay._id,   policyId: 'POL003', policyholderId: 'PH002', amount: 12000, reason: 'Dental Surgery',                        status: 'Pending'  },
    { id: 'CLM006', userId: sarah._id, policyId: 'POL004', policyholderId: 'PH003', amount: 35000, reason: 'Maternity - Delivery Expenses',         status: 'Approved' },
    { id: 'CLM007', userId: sarah._id, policyId: 'POL004', policyholderId: 'PH003', amount: 9000,  reason: 'Physiotherapy Sessions',                status: 'Pending'  },
    { id: 'CLM008', userId: sarah._id, policyId: 'POL005', policyholderId: 'PH003', amount: 45000, reason: 'Vehicle Accident - Repair Cost',        status: 'Approved' },
    { id: 'CLM009', userId: sarah._id, policyId: 'POL005', policyholderId: 'PH003', amount: 5000,  reason: 'Minor Dent - Parking Incident',         status: 'Rejected' },
    { id: 'CLM010', userId: sarah._id, policyId: 'POL006', policyholderId: 'PH004', amount: 18000, reason: 'Cataract Surgery',                      status: 'Pending'  },
  ]);
  console.log(`Created ${claims.length} claims...`);

  console.log('✅ Database seeded successfully!');
  console.log('Summary:');
  console.log(`  - ${policyholders.length} Policyholders`);
  console.log(`  - ${policies.length} Policies`);
  console.log(`  - ${claims.length} Claims`);

  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});