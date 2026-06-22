require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { generateToken, verifyToken, verifyAdmin } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

const User = require('./models/User');
const Policyholder = require('./models/Policyholder');
const Policy = require('./models/Policy');
const Claim = require('./models/Claim');
const PolicyPlan       = require('./models/PolicyPlan');
const policyPlanRoutes = require('./policyPlans');
const claimRoutes      = require('./claims');

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
      version: '3.0.0',
      description: 'Multi-user Claims Management API with MongoDB and JWT auth',
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
app.use('/policy-plans', policyPlanRoutes);
app.use('/claims', claimRoutes);

// ─── AUTH ROUTES ───────────────────────────────────────────────

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
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
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Username already exists
 */
app.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;
    if (!username || !password || !fullName || !email)
      return res.status(400).json({ error: 'All fields are required' });

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing)
      return res.status(409).json({ error: 'Username or email already exists' });

    const user = new User({ username, password, fullName, email, role: 'user' });
    await user.save();

    const token = generateToken(user._id, user.username, user.role);
    res.status(201).json({ token, role: user.role, username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user._id, user.username, user.role);
    res.json({ token, role: user.role, username: user.username, userId: user._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── USER MANAGEMENT (Admin only) ─────────────────────────────

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
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
 *         description: User deleted
 */
app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POLICYHOLDER ROUTES ───────────────────────────────────────

app.post('/policyholders', verifyToken, async (req, res) => {
  try {
    const { id, name, email, phone } = req.body;
    if (!id || !name || !email || !phone)
      return res.status(400).json({ error: 'All fields are required' });

    const existing = await Policyholder.findOne({ id });
    if (existing)
      return res.status(409).json({ error: 'Policyholder ID already exists' });

    const ph = new Policyholder({ id, name, email, phone, userId: req.user.userId });
    await ph.save();
    res.status(201).json(ph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/policyholders', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const policyholders = await Policyholder.find(filter);
    res.json(policyholders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/policyholders/:id', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.userId };
    const ph = await Policyholder.findOne(filter);
    if (!ph) return res.status(404).json({ error: 'Policyholder not found' });
    res.json(ph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/policyholders/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const filter = req.user.role === 'admin'
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.userId };
    const ph = await Policyholder.findOneAndUpdate(filter, { name, email, phone }, { new: true });
    if (!ph) return res.status(404).json({ error: 'Policyholder not found' });
    res.json(ph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/policyholders/:id', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.userId };
    const ph = await Policyholder.findOneAndDelete(filter);
    if (!ph) return res.status(404).json({ error: 'Policyholder not found' });
    res.json({ message: 'Policyholder deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POLICY ROUTES ─────────────────────────────────────────────

app.post('/policies', verifyToken, async (req, res) => {
  try {
    const { id, policyholderId, type, coverageAmount, startDate, endDate } = req.body;
    if (!id || !policyholderId || !type || !coverageAmount || !startDate || !endDate)
      return res.status(400).json({ error: 'All fields are required' });

    const ph = await Policyholder.findOne({ id: policyholderId });
    if (!ph) return res.status(404).json({ error: 'Policyholder not found' });

    const existing = await Policy.findOne({ id });
    if (existing) return res.status(409).json({ error: 'Policy ID already exists' });

    const policy = new Policy({ id, policyholderId, type, coverageAmount, startDate, endDate, userId: req.user.userId });
    await policy.save();
    res.status(201).json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/policies', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const policies = await Policy.find(filter);
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/policies/:id', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.userId };
    const policy = await Policy.findOne(filter);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/policies/:id', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.userId };
    const policy = await Policy.findOneAndDelete(filter);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    res.json({ message: 'Policy deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/policies/:id/claims', verifyToken, async (req, res) => {
  try {
    const policy = await Policy.findOne({ id: req.params.id });
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    const claims = await Claim.find({ policyId: req.params.id });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CLAIM ROUTES ──────────────────────────────────────────────

app.post('/claims', verifyToken, async (req, res) => {
  try {
    const { id, policyId, amount, reason } = req.body;
    if (!id || !policyId || !amount || !reason)
      return res.status(400).json({ error: 'All fields are required' });

    const policy = await Policy.findOne({ id: policyId });
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    const existing = await Claim.findOne({ id });
    if (existing) return res.status(409).json({ error: 'Claim ID already exists' });

    const claim = new Claim({ id, policyId, amount, reason, userId: req.user.userId });
    await claim.save();
    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/claims', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const claims = await Claim.find(filter);
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/claims/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status))
      return res.status(400).json({ error: 'Invalid status value' });
    const claim = await Claim.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/claims/:id', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.userId };
    const claim = await Claim.findOneAndDelete(filter);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json({ message: 'Claim deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server };