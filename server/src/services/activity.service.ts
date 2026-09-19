import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export async function logActivity(taskId: string, userId: string, action: string, details?: Record<string, unknown>) {
  return prisma.activity.create({
    data: {
      taskId,
      userId,
      action,
      details: (details as Prisma.InputJsonObject | undefined) ?? undefined,
    },
  });
}

export async function getTaskActivities(taskId: string, limit = 50) {
  return prisma.activity.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, avatarColor: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
