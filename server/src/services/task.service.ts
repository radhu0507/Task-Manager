import { prisma } from '../utils/prisma';
import { createError } from '../middleware/errorHandler';
import { logActivity } from './activity.service';
import { Prisma, Priority, Status } from '@prisma/client';
import { emitToTask, emitToUser } from './realtime';

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  assigneeIds?: string[];
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  assigneeIds?: string[];
}

interface TaskQuery {
  page: string;
  limit: string;
  status?: string;
  priority?: string;
  search?: string;
  assigneeId?: string;
  creatorId?: string;
  sortBy?: string;
  sortOrder?: string;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: string;
}

export class TaskService {
  async create(data: CreateTaskInput, userId: string) {
    const { assigneeIds, dueDate } = data;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: (data.priority || 'MEDIUM') as Priority,
        status: (data.status || 'TODO') as Status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        creatorId: userId,
        assignees: assigneeIds?.length
          ? { create: assigneeIds.map(id => ({ userId: id })) }
          : undefined,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarColor: true } },
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
        _count: { select: { comments: true, attachments: true } },
      },
    });

    await logActivity(task.id, userId, 'TASK_CREATED', { title: task.title });
    emitToTask(task.id, 'task:updated', { taskId: task.id, action: 'created' });
    emitToUser(userId, 'notification', { message: `Task created: ${task.title}`, taskId: task.id });

    return task;
  }

  async getAll(query: TaskQuery, _userId: string) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    if (query.status) where.status = query.status as Prisma.EnumStatusFilter<'Task'> | Status;
    if (query.priority) where.priority = query.priority as Prisma.EnumPriorityFilter<'Task'> | Priority;
    if (query.creatorId) where.creatorId = query.creatorId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.assigneeId) {
      where.assignees = { some: { userId: query.assigneeId } };
    }
    let dueDateWhere: Prisma.DateTimeFilter | undefined;
    if (query.dueBefore) {
      dueDateWhere = { ...(dueDateWhere || {}), lte: new Date(query.dueBefore) };
    }
    if (query.dueAfter) {
      dueDateWhere = { ...(dueDateWhere || {}), gte: new Date(query.dueAfter) };
    }
    if (query.overdue === 'true') {
      where.dueDate = { lte: new Date() };
      where.status = { not: 'COMPLETED' };
    } else if (dueDateWhere) {
      where.dueDate = dueDateWhere;
    }

    const orderBy: Record<string, string> = {};
    if (query.sortBy === 'priority') {
      orderBy.priority = query.sortOrder || 'desc';
    } else {
      orderBy[query.sortBy || 'createdAt'] = query.sortOrder || 'desc';
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          creator: { select: { id: true, name: true, email: true, avatarColor: true } },
          assignees: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
          _count: { select: { comments: true, attachments: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarColor: true } },
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
        comments: {
          include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: { user: { select: { id: true, name: true, avatarColor: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: { select: { comments: true, attachments: true, activities: true } },
      },
    });

    if (!task) {
      throw createError(404, 'NOT_FOUND', 'Task not found');
    }

    return task;
  }

  async update(id: string, data: UpdateTaskInput, userId: string, userRole: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Task not found');
    }

    if (existing.creatorId !== userId && !['ADMIN', 'MANAGER'].includes(userRole)) {
      const isAssignee = await prisma.taskAssignee.findUnique({
        where: { taskId_userId: { taskId: id, userId } },
      });
      if (!isAssignee) {
        throw createError(403, 'FORBIDDEN', 'Not authorized to update this task');
      }
    }

    const { assigneeIds, dueDate } = data;
    const changes: Record<string, unknown> = {};

    if (data.title !== undefined && data.title !== existing.title) {
      changes.title = { from: existing.title, to: data.title };
    }
    if (data.status !== undefined && data.status !== existing.status) {
      changes.status = { from: existing.status, to: data.status };
    }
    if (data.priority !== undefined && data.priority !== existing.priority) {
      changes.priority = { from: existing.priority, to: data.priority };
    }
    if (data.description !== undefined && data.description !== existing.description) {
      changes.description = { from: existing.description, to: data.description };
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description !== undefined ? data.description : undefined,
        priority: data.priority !== undefined ? (data.priority as Priority) : undefined,
        status: data.status !== undefined ? (data.status as Status) : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        assignees: assigneeIds !== undefined
          ? {
              deleteMany: {},
              create: assigneeIds.map(assigneeId => ({ userId: assigneeId })),
            }
          : undefined,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarColor: true } },
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
        _count: { select: { comments: true, attachments: true } },
      },
    });

    if (Object.keys(changes).length > 0) {
      await logActivity(id, userId, 'TASK_UPDATED', changes);
    }

    if (data.status && data.status !== existing.status) {
      await logActivity(id, userId, 'STATUS_CHANGED', { from: existing.status, to: data.status });
    }
    if (data.priority && data.priority !== existing.priority) {
      await logActivity(id, userId, 'PRIORITY_CHANGED', { from: existing.priority, to: data.priority });
    }
    if (assigneeIds !== undefined) {
      await logActivity(id, userId, 'ASSIGNEES_UPDATED', { assigneeIds });
    }

    emitToTask(id, 'task:updated', { taskId: id, action: 'updated', changes });

    if (data.status) {
      for (const a of task.assignees) {
        emitToUser(a.user.id, 'notification', { message: `Task "${task.title}" status changed to ${data.status}`, taskId: id });
      }
    }

    return task;
  }

  async delete(id: string, userId: string, userRole: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Task not found');
    }

    if (existing.creatorId !== userId && !['ADMIN', 'MANAGER'].includes(userRole)) {
      throw createError(403, 'FORBIDDEN', 'Not authorized to delete this task');
    }

    await prisma.task.delete({ where: { id } });
    emitToTask(id, 'task:deleted', { taskId: id });
    return { message: 'Task deleted successfully' };
  }
}

export const taskService = new TaskService();
