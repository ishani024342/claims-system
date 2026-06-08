require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Import models
const Policyholder = require('./models/Policyholder');
const Policy = require('./models/Policy');
const Claim = require('./models/Claim');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── POLICYHOLDER ROUTES ───────────────────────────────────────

// Create policyholder
app.post('/policyholders', async (req, res) => {
  try {
    const { id, name, email, phone } = req.body;
    if (!id || !name || !email || !phone)
      return res.status(400).json({ error: 'All fields are required' });

    const existing = await Policyholder.findOne({ id });
    if (existing)
      return res.status(409).json({ error: 'Policyholder ID already exists' });

    const ph = new Policyholder({ id, name, email, phone });
    await ph.save();
    res.status(201).json(ph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all policyholders
app.get('/policyholders', async (req, res) => {
  try {
    const policyholders = await Policyholder.find();
    res.json(policyholders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get policyholder by ID
app.get('/policyholders/:id', async (req, res) => {
  try {
    const ph = await Policyholder.findOne({ id: req.params.id });
    if (!ph) return res.status(404).json({ error: 'Policyholder not found' });
    res.json(ph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POLICY ROUTES ─────────────────────────────────────────────

// Create policy
app.post('/policies', async (req, res) => {
  try {
    const { id, policyholderId, type, coverageAmount, startDate, endDate } = req.body;
    if (!id || !policyholderId || !type || !coverageAmount || !startDate || !endDate)
      return res.status(400).json({ error: 'All fields are required' });

    const ph = await Policyholder.findOne({ id: policyholderId });
    if (!ph)
      return res.status(404).json({ error: 'Policyholder not found' });

    const existing = await Policy.findOne({ id });
    if (existing)
      return res.status(409).json({ error: 'Policy ID already exists' });

    const policy = new Policy({ id, policyholderId, type, coverageAmount, startDate, endDate });
    await policy.save();
    res.status(201).json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all policies
app.get('/policies', async (req, res) => {
  try {
    const policies = await Policy.find();
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get policy by ID
app.get('/policies/:id', async (req, res) => {
  try {
    const policy = await Policy.findOne({ id: req.params.id });
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CLAIM ROUTES ──────────────────────────────────────────────

// Create claim
app.post('/claims', async (req, res) => {
  try {
    const { id, policyId, amount, reason } = req.body;
    if (!id || !policyId || !amount || !reason)
      return res.status(400).json({ error: 'All fields are required' });

    const policy = await Policy.findOne({ id: policyId });
    if (!policy)
      return res.status(404).json({ error: 'Policy not found' });

    const existing = await Claim.findOne({ id });
    if (existing)
      return res.status(409).json({ error: 'Claim ID already exists' });

    const claim = new Claim({ id, policyId, amount, reason });
    await claim.save();
    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all claims
app.get('/claims', async (req, res) => {
  try {
    const claims = await Claim.find();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update claim status
app.patch('/claims/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status))
      return res.status(400).json({ error: 'Invalid status value' });

    const claim = await Claim.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    );
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));