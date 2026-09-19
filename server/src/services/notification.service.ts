import { prisma } from '../utils/prisma';

export class NotificationService {
  async create(userId: string, message: string, taskId?: string) {
    return prisma.notification.create({
      data: { userId, message, taskId },
    });
  }

  async getByUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) return null;
    return prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }
}

export const notificationService = new NotificationService();
