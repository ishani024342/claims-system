require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { generateToken, verifyToken } = require('./auth');

const app = express();
app.use(express.json());

const Policyholder = require('./models/Policyholder');
const Policy = require('./models/Policy');
const Claim = require('./models/Claim');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── SWAGGER SETUP ─────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Claims Management System API',
      version: '2.0.0',
      description: 'Stateful Claims Management API with MongoDB and JWT auth',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── AUTH ROUTE ────────────────────────────────────────────────
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login and get JWT token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns JWT token
 *       401:
 *         description: Invalid credentials
 */
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    const token = generateToken(username);
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// ─── POLICYHOLDER ROUTES ───────────────────────────────────────
/**
 * @swagger
 * /policyholders:
 *   post:
 *     summary: Create a new policyholder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Policyholder created
 *       400:
 *         description: Missing fields
 *       409:
 *         description: ID already exists
 */
app.post('/policyholders', verifyToken, async (req, res) => {
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

/**
 * @swagger
 * /policyholders:
 *   get:
 *     summary: Get all policyholders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of policyholders
 */
app.get('/policyholders', verifyToken, async (req, res) => {
  try {
    const policyholders = await Policyholder.find();
    res.json(policyholders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /policyholders/{id}:
 *   get:
 *     summary: Get policyholder by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Policyholder found
 *       404:
 *         description: Not found
 */
app.get('/policyholders/:id', verifyToken, async (req, res) => {
  try {
    const ph = await Policyholder.findOne({ id: req.params.id });
    if (!ph) return res.status(404).json({ error: 'Policyholder not found' });
    res.json(ph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POLICY ROUTES ─────────────────────────────────────────────
/**
 * @swagger
 * /policies:
 *   post:
 *     summary: Create a new policy
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               policyholderId:
 *                 type: string
 *               type:
 *                 type: string
 *               coverageAmount:
 *                 type: number
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: Policy created
 *       404:
 *         description: Policyholder not found
 */
app.post('/policies', verifyToken, async (req, res) => {
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

/**
 * @swagger
 * /policies:
 *   get:
 *     summary: Get all policies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of policies
 */
app.get('/policies', verifyToken, async (req, res) => {
  try {
    const policies = await Policy.find();
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /policies/{id}:
 *   get:
 *     summary: Get policy by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Policy found
 *       404:
 *         description: Not found
 */
app.get('/policies/:id', verifyToken, async (req, res) => {
  try {
    const policy = await Policy.findOne({ id: req.params.id });
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CLAIM ROUTES ──────────────────────────────────────────────
/**
 * @swagger
 * /claims:
 *   post:
 *     summary: Create a new claim
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               policyId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Claim created
 *       404:
 *         description: Policy not found
 */
app.post('/claims', verifyToken, async (req, res) => {
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

/**
 * @swagger
 * /claims:
 *   get:
 *     summary: Get all claims
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of claims
 */
app.get('/claims', verifyToken, async (req, res) => {
  try {
    const claims = await Claim.find();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /claims/{id}/status:
 *   patch:
 *     summary: Update claim status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Claim not found
 */
app.patch('/claims/:id/status', verifyToken, async (req, res) => {
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