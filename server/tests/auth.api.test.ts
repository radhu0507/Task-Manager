import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';

vi.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import app from '../src/app';
import { prisma } from '../src/utils/prisma';

const mockedPrisma = vi.mocked(prisma);

describe('Auth API integration', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /auth/signup creates an account and returns a cookie', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alpha',
      role: 'MEMBER',
      avatarColor: '#6366f1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'a@example.com', name: 'Alpha', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('a@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/signup returns 409 for a duplicate email', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as never);
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'dup@example.com', name: 'Dup', password: 'secret123' });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('POST /auth/signup returns 400 for invalid payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'not-an-email', name: '', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /auth/login rejects bad credentials', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bad@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /auth/me returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

afterAll(() => vi.restoreAllMocks());