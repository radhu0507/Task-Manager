import { prisma } from '../utils/prisma';
import { config } from '../config';
import { createError } from '../middleware/errorHandler';
import { logActivity } from './activity.service';
import { emitToTask } from './realtime';

export class UploadService {
  async upload(taskId: string, file: Express.Multer.File, userId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw createError(404, 'NOT_FOUND', 'Task not found');

    const attachment = await prisma.attachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        taskId,
        userId,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    await logActivity(taskId, userId, 'ATTACHMENT_UPLOADED', {
      attachmentId: attachment.id,
      filename: file.originalname,
      size: file.size,
    });
    emitToTask(taskId, 'attachment:added', { taskId, attachment });

    return attachment;
  }

  async getByTaskId(taskId: string) {
    return prisma.attachment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(attachmentId: string, userId: string, userRole: string) {
    const existing = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!existing) throw createError(404, 'NOT_FOUND', 'Attachment not found');

    if (existing.userId !== userId && !['ADMIN', 'MANAGER'].includes(userRole)) {
      throw createError(403, 'FORBIDDEN', 'Not authorized to delete this attachment');
    }

    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(config.uploadDir, existing.filename);
    await fs.unlink(filePath).catch(() => {});

    await prisma.attachment.delete({ where: { id: attachmentId } });
    await logActivity(existing.taskId, userId, 'ATTACHMENT_DELETED', { attachmentId });
    return { message: 'Attachment deleted' };
  }
}

export const uploadService = new UploadService();
