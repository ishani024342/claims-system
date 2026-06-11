const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

describe('Auth Routes', () => {
  test('POST /register - should register a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        username: `testuser_${Date.now()}`,
        password: 'test123',
        fullName: 'Test User',
        email: `test_${Date.now()}@example.com`
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('user');
  });

  test('POST /register - should fail with missing fields', async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: 'incomplete' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /login - should login with valid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('admin');
  });

  test('POST /login - should fail with wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /login - should fail with non-existent user', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'nobody', password: 'test123' });
    expect(res.statusCode).toBe(401);
  });
});