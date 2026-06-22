// store.js
const policyholders = [
    { id: "PH001", name: "Ishani Sharma", isActive: true }
];

const policies = [
    { 
        id: "POL100", 
        policyholderId: "PH001", 
        coverageAmount: 50000, 
        startDate: "2026-01-01", 
        endDate: "2026-12-31" 
    }
];

const claims = []; // Your temporary data store for claims

module.exports = { policyholders, policies, claims };