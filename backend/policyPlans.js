const express  = require('express');
const router   = express.Router();        // ← this line is missing
const { v4: uuidv4 } = require('uuid');
const PolicyPlan   = require('./models/PolicyPlan');
const Policy       = require('./models/Policy');
const Policyholder = require('./models/Policyholder');
const { verifyToken, verifyAdmin } = require('./auth');

// ─────────────────────────────────────────────────────────────
//  ADMIN — Create a plan template
//  POST /policy-plans
// ─────────────────────────────────────────────────────────────
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, type, coverageAmount, premium, durationMonths, description, features } = req.body;

    if (!name || !type || !coverageAmount || !premium || !durationMonths || !description)
      return res.status(400).json({ error: 'name, type, coverageAmount, premium, durationMonths, description are required' });

    const plan = new PolicyPlan({
      name, type, coverageAmount, premium, durationMonths, description,
      features: features || [],
      isActive: true,
    });
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  PUBLIC — Browse all active plans (no login needed)
//  GET /policy-plans
// ─────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const plans = await PolicyPlan.find({ isActive: true }).sort({ premium: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN — Get ALL plans including inactive
//  GET /policy-plans/all
// ─────────────────────────────────────────────────────────────
router.get('/all', verifyToken, verifyAdmin, async (_req, res) => {
  try {
    const plans = await PolicyPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  PUBLIC — Get single plan by id
//  GET /policy-plans/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const plan = await PolicyPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN — Update a plan
//  PUT /policy-plans/:id
// ─────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const plan = await PolicyPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN — Toggle plan active/inactive (soft delete)
//  PATCH /policy-plans/:id/toggle
// ─────────────────────────────────────────────────────────────
router.patch('/:id/toggle', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const plan = await PolicyPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json({ message: `Plan ${plan.isActive ? 'activated' : 'deactivated'}`, plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  USER — Apply for a plan
//  POST /policy-plans/:id/apply
//
//  Body: { policyholderId }
//  → Creates a real Policy linked to this plan
// ─────────────────────────────────────────────────────────────
router.post('/:id/apply', verifyToken, async (req, res) => {
  try {
    const plan = await PolicyPlan.findById(req.params.id);
    if (!plan)           return res.status(404).json({ error: 'Plan not found' });
    if (!plan.isActive)  return res.status(400).json({ error: 'This plan is no longer available' });

    const { policyholderId } = req.body;
    if (!policyholderId)
      return res.status(400).json({ error: 'policyholderId is required' });

    // Verify policyholder belongs to this user
    const ph = await Policyholder.findOne({ id: policyholderId, userId: req.user.userId });
    if (!ph)
      return res.status(404).json({ error: 'Policyholder not found or does not belong to you' });

    // Calculate dates
    const startDate = new Date();
    const endDate   = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const fmt = (d) => d.toISOString().split('T')[0]; // YYYY-MM-DD

    const policy = new Policy({
      id:             uuidv4(),
      userId:         req.user.userId,
      policyholderId,
      type:           plan.type,
      coverageAmount: plan.coverageAmount,
      premium:        plan.premium,
      startDate:      fmt(startDate),
      endDate:        fmt(endDate),
      planId:         plan._id,
      planName:       plan.name,
      status:         'ACTIVE',
    });

    await policy.save();
    res.status(201).json({ message: 'Policy applied successfully!', policy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
