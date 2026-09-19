import { prisma } from '../utils/prisma';
import { createError } from '../middleware/errorHandler';
import { logActivity } from './activity.service';
import { emitToTask, emitToUser } from './realtime';

export class CommentService {
  async getByTaskId(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw createError(404, 'NOT_FOUND', 'Task not found');

    return prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(taskId: string, content: string, userId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw createError(404, 'NOT_FOUND', 'Task not found');

    const comment = await prisma.comment.create({
      data: { content, taskId, userId },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
    });

    await logActivity(taskId, userId, 'COMMENT_ADDED', { commentId: comment.id, preview: content.substring(0, 100) });
    emitToTask(taskId, 'comment:added', { taskId, comment });

    const taskForNotify = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true } });
    if (taskForNotify) {
      for (const a of taskForNotify.assignees) {
        if (a.userId !== userId) {
          emitToUser(a.userId, 'notification', { message: `New comment on "${taskForNotify.title}"`, taskId });
        }
      }
    }

    return comment;
  }

  async update(commentId: string, content: string, userId: string, userRole: string) {
    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw createError(404, 'NOT_FOUND', 'Comment not found');

    if (existing.userId !== userId && !['ADMIN', 'MANAGER'].includes(userRole)) {
      throw createError(403, 'FORBIDDEN', 'Not authorized to edit this comment');
    }

    return prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
    });
  }

  async delete(commentId: string, userId: string, userRole: string) {
    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw createError(404, 'NOT_FOUND', 'Comment not found');

    if (existing.userId !== userId && !['ADMIN', 'MANAGER'].includes(userRole)) {
      throw createError(403, 'FORBIDDEN', 'Not authorized to delete this comment');
    }

    await prisma.comment.delete({ where: { id: commentId } });
    await logActivity(existing.taskId, userId, 'COMMENT_DELETED', { commentId });
    return { message: 'Comment deleted' };
  }
}

export const commentService = new CommentService();
