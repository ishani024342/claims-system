const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');

let adminToken;
let userToken;
const testPhId = `PH_TEST_${Date.now()}`;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Login as admin
  const adminRes = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'admin123' });
  adminToken = adminRes.body.token;

  // Login as john
  const userRes = await request(app)
    .post('/login')
    .send({ username: 'john', password: 'john123' });
  userToken = userRes.body.token;
});

afterAll(async () => {
  // Cleanup test data
  const Policyholder = require('../models/Policyholder');
  await Policyholder.deleteOne({ id: testPhId });
  await mongoose.connection.close();
  server.close();
});

describe('Policyholder Routes', () => {
  test('POST /policyholders - should create a policyholder', async () => {
    const res = await request(app)
      .post('/policyholders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        id: testPhId,
        name: 'Test Holder',
        email: 'testholder@example.com',
        phone: '9000000000'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(testPhId);
  });

  test('POST /policyholders - should fail without token', async () => {
    const res = await request(app)
      .post('/policyholders')
      .send({ id: 'PH999', name: 'No Auth', email: 'x@x.com', phone: '123' });
    expect(res.statusCode).toBe(401);
  });

  test('POST /policyholders - should fail with duplicate ID', async () => {
    const res = await request(app)
      .post('/policyholders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        id: testPhId,
        name: 'Duplicate',
        email: 'dup@example.com',
        phone: '9000000001'
      });
    expect(res.statusCode).toBe(409);
  });

  test('GET /policyholders - should return list', async () => {
    const res = await request(app)
      .get('/policyholders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /policyholders/:id - should return specific policyholder', async () => {
    const res = await request(app)
      .get(`/policyholders/${testPhId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(testPhId);
  });

  test('PUT /policyholders/:id - should update policyholder', async () => {
    const res = await request(app)
      .put(`/policyholders/${testPhId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated Name', email: 'updated@example.com', phone: '9111111111' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  test('DELETE /policyholders/:id - admin should delete', async () => {
    const res = await request(app)
      .delete(`/policyholders/${testPhId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});