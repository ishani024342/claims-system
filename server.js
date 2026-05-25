// server.js
const express = require('express');
const { policyholders, policies, claims } = require('./store');

const app = express();
app.use(express.json()); // Allows reading JSON data

// 1. CREATE: Submit a Claim
app.post('/api/claims', (req, res) => {
    const { policyId, claimAmount, claimDate } = req.body;

    // Rule: Basic Validation
    if (!policyId || !claimAmount || !claimDate) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Rule: Check if Policy Exists
    const policy = policies.find(p => p.id === policyId);
    if (!policy) {
        return res.status(404).json({ error: "Policy not found." });
    }

    // Rule: Claim cannot exceed policy amount
    if (claimAmount > policy.coverageAmount) {
        return res.status(400).json({ error: "Claim rejected. Amount exceeds policy coverage." });
    }

    // If rules pass, save it
    const newClaim = {
        id: `CLM${Date.now()}`,
        policyId,
        claimAmount,
        claimDate,
        status: "PENDING"
    };

    claims.push(newClaim);
    return res.status(201).json({ message: "Claim created successfully", claim: newClaim });
});

// 2. READ: Get All Claims
app.get('/api/claims', (req, res) => {
    return res.status(200).json(claims);
});

// Start server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});