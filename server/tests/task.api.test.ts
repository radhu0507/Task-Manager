import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    taskAssignee: {
      findUnique: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import app from '../src/app';
import { prisma } from '../src/utils/prisma';

const mockedPrisma = vi.mocked(prisma);

const UUID = '2e0a50d4-4b1e-4b6b-9e1d-30c61f7e9a38';
const SECRET = 'dev-secret-change-this';

const baseUser = {
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN',
  avatarColor: '#6366f1',
  createdAt: new Date(),
};

function tokenFor(userId: string) {
  return jwt.sign({ userId }, SECRET);
}

function mockAuthUser(userId: string, role: string) {
  mockedPrisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
    if (where.id === userId) return { id: userId, ...baseUser, role } as never;
    return null;
  });
}

describe('Task API - unauthenticated', () => {
  it('GET /tasks returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
  });

  it('GET /tasks rejects an invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('Task API - authorized flows', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /tasks creates a task for an admin', async () => {
    const token = tokenFor('admin-1');
    mockAuthUser('admin-1', 'ADMIN');

    mockedPrisma.task.create.mockResolvedValue({
      id: 'task-1',
      title: 'My Task',
      description: null,
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: null,
      creatorId: 'admin-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      creator: { id: 'admin-1', ...baseUser },
      assignees: [],
      _count: { comments: 0, attachments: 0 },
    } as never);
    mockedPrisma.activity.create.mockResolvedValue({} as never);

    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Task' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My Task');
    expect(mockedPrisma.task.create).toHaveBeenCalledOnce();
  });

  it('POST /tasks returns 400 for invalid payload', async () => {
    const token = tokenFor('admin-1');
    mockAuthUser('admin-1', 'ADMIN');

    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /tasks/:id rejects a non-creator MEMBER who is not assigned', async () => {
    const token = tokenFor('member-1');
    mockAuthUser('member-1', 'MEMBER');

    mockedPrisma.task.findUnique.mockResolvedValue({
      id: 'task-1',
      title: 'Other Task',
      priority: 'MEDIUM',
      status: 'TODO',
      description: null,
      creatorId: 'admin-1',
    } as never);
    mockedPrisma.taskAssignee.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/v1/tasks/${UUID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('DELETE /tasks/:id is forbidden for a non-creator MEMBER', async () => {
    const token = tokenFor('member-1');
    mockAuthUser('member-1', 'MEMBER');

    mockedPrisma.task.findUnique.mockResolvedValue({ id: 'task-1', creatorId: 'admin-1' } as never);

    const res = await request(app)
      .delete(`/api/v1/tasks/${UUID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /tasks/:id returns 404 for a missing task', async () => {
    const token = tokenFor('admin-1');
    mockAuthUser('admin-1', 'ADMIN');
    mockedPrisma.task.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/v1/tasks/${UUID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});