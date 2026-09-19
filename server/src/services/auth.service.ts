import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { createError } from '../middleware/errorHandler';

export class AuthService {
  async signup(email: string, name: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createError(409, 'CONFLICT', 'Email already in use');
    }

    const hashed = await bcrypt.hash(password, 12);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#22c55e', '#06b6d4', '#3b82f6'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await prisma.user.create({
      data: { email, name, password: hashed, avatarColor },
      select: { id: true, email: true, name: true, role: true, avatarColor: true, createdAt: true },
    });

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw createError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const token = this.generateToken(user.id);
    const safeUser = { ...user };
    delete (safeUser as { password?: string }).password;
    return { user: safeUser, token };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, avatarColor: true, createdAt: true, updatedAt: true },
    });
    if (!user) {
      throw createError(404, 'NOT_FOUND', 'User not found');
    }
    return user;
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }
}

export const authService = new AuthService();
