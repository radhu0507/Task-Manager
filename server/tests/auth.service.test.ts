import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '../src/utils/prisma';
import { authService } from '../src/services/auth.service';

const mockedPrisma = vi.mocked(prisma);

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('throws a conflict error when the email already exists', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: '1' } as never);
      await expect(authService.signup('dup@example.com', 'Dup', 'secret123')).rejects.toMatchObject({
        statusCode: 409,
        code: 'CONFLICT',
      });
    });

    it('creates a user and returns a token on success', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
        name: 'New User',
        role: 'MEMBER',
        avatarColor: '#6366f1',
        createdAt: new Date(),
      } as never);

      const result = await authService.signup('new@example.com', 'New User', 'secret123');
      expect(result.user.name).toBe('New User');
      expect(result.token).toBeTruthy();
      expect(mockedPrisma.user.create).toHaveBeenCalledOnce();
    });
  });

  describe('login', () => {
    it('rejects unknown emails', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login('nope@example.com', 'whatever')).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });
});