const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');

let adminToken;
let userToken;
const ts = Date.now();
const phId = `PH_CL_${ts}`;
const polId = `POL_CL_${ts}`;
const claimId = `CLM_CL_${ts}`;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const adminRes = await request(app).post('/login').send({ username: 'admin', password: 'admin123' });
  adminToken = adminRes.body.token;

  const userRes = await request(app).post('/login').send({ username: 'john', password: 'john123' });
  userToken = userRes.body.token;

  // Create test policyholder and policy
  await request(app).post('/policyholders').set('Authorization', `Bearer ${userToken}`)
    .send({ id: phId, name: 'Claim Test Holder', email: `claimtest_${ts}@ex.com`, phone: '9000000002' });

  await request(app).post('/policies').set('Authorization', `Bearer ${userToken}`)
    .send({ id: polId, policyholderId: phId, type: 'Health', coverageAmount: 100000, startDate: '2026-01-01', endDate: '2027-01-01' });
});

afterAll(async () => {
  const Claim = require('../models/Claim');
  const Policy = require('../models/Policy');
  const Policyholder = require('../models/Policyholder');
  await Claim.deleteOne({ id: claimId });
  await Policy.deleteOne({ id: polId });
  await Policyholder.deleteOne({ id: phId });
  await mongoose.connection.close();
  server.close();
});

describe('Claims Routes', () => {
  test('POST /claims - should create a claim', async () => {
    const res = await request(app)
      .post('/claims')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ id: claimId, policyId: polId, amount: 5000, reason: 'Test hospitalization' });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('Pending');
  });

  test('POST /claims - should fail without token', async () => {
    const res = await request(app)
      .post('/claims')
      .send({ id: 'CLM999', policyId: polId, amount: 1000, reason: 'No auth' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /claims - user should see only their claims', async () => {
    const res = await request(app)
      .get('/claims')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /claims - admin should see all claims', async () => {
    const res = await request(app)
      .get('/claims')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PATCH /claims/:id/status - admin should approve claim', async () => {
    const res = await request(app)
      .patch(`/claims/${claimId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Approved' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Approved');
  });

  test('PATCH /claims/:id/status - user should not update status', async () => {
    const res = await request(app)
      .patch(`/claims/${claimId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'Approved' });
    expect(res.statusCode).toBe(403);
  });

  test('DELETE /claims/:id - should delete claim', async () => {
    const res = await request(app)
      .delete(`/claims/${claimId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});