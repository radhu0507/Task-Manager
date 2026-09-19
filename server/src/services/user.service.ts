import { prisma } from '../utils/prisma';

export class UserService {
  async getAll() {
    return prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, avatarColor: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, avatarColor: true, createdAt: true, updatedAt: true },
    });
    if (!user) return null;
    return user;
  }
}

export const userService = new UserService();
