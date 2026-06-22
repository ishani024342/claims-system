const express = require('express');
const router  = express.Router();
const Claim   = require('./models/Claim');
const Policy  = require('./models/Policy');
const { verifyToken, verifyAdmin } = require('./auth');
// ─────────────────────────────────────────────────────────────
//  USER — File a claim
//  POST /claims
// ─────────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { id, policyId, amount, reason, incidentDate } = req.body;
    if (!id || !policyId || !amount || !reason)
      return res.status(400).json({ error: 'id, policyId, amount, reason are required' });

    // Fetch the policy — must belong to this user
    const policy = await Policy.findOne({ id: policyId, userId: req.user.userId });
    if (!policy)
      return res.status(404).json({ error: 'Policy not found or does not belong to you' });

    // Business Rule 1: Policy must be ACTIVE
    if (policy.status !== 'ACTIVE')
      return res.status(400).json({ error: `Cannot file a claim on a ${policy.status} policy` });

    // Business Rule 2: Claim amount cannot exceed coverage
    if (Number(amount) > policy.coverageAmount)
      return res.status(400).json({
        error: `Claim amount (₹${amount}) exceeds policy coverage (₹${policy.coverageAmount})`
      });

    // Business Rule 3: Incident date within policy period
    if (incidentDate) {
      const incident = new Date(incidentDate);
      const start    = new Date(policy.startDate);
      const end      = new Date(policy.endDate);
      if (incident < start || incident > end)
        return res.status(400).json({ error: 'Incident date must be within the policy period' });
    }

    const existing = await Claim.findOne({ id });
    if (existing) return res.status(409).json({ error: 'Claim ID already exists' });

    const claim = new Claim({
      id,
      userId:         req.user.userId,
      policyId,
      policyholderId: policy.policyholderId,
      amount:         Number(amount),
      reason,
      incidentDate:   incidentDate || '',
      status:         'Pending',
    });
    await claim.save();
    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  USER — Get my claims  |  ADMIN — Get all claims
//  GET /claims
// ─────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const claims = await Claim.find(filter).sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  USER/ADMIN — Get single claim
//  GET /claims/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.userId };
    const claim = await Claim.findOne(filter);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN — Approve or Reject a claim
//  PATCH /claims/:id/status
// ─────────────────────────────────────────────────────────────
router.patch('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status))
      return res.status(400).json({ error: 'status must be Pending, Approved, or Rejected' });

    const claim = await Claim.findOne({ id: req.params.id });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    // Business Rule: once decided, cannot be changed back to Pending
    if (claim.status !== 'Pending' && status === 'Pending')
      return res.status(400).json({ error: 'Cannot revert a decided claim back to Pending' });

    claim.status    = status;
    claim.adminNote = adminNote || '';
    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  USER — Delete a PENDING claim  |  ADMIN — Delete any claim
//  DELETE /claims/:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.userId, status: 'Pending' };

    const claim = await Claim.findOneAndDelete(filter);
    if (!claim)
      return res.status(404).json({ error: 'Claim not found or cannot be deleted (only Pending claims can be deleted)' });

    res.json({ message: 'Claim deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
