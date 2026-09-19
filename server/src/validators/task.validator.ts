import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    dueDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    assigneeIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    dueDate: z.string().optional().nullable().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    assigneeIds: z.array(z.string().uuid()).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const taskIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const taskQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    search: z.string().optional(),
    assigneeId: z.string().uuid().optional(),
    creatorId: z.string().uuid().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    dueBefore: z.string().optional(),
    dueAfter: z.string().optional(),
    overdue: z.string().optional(),
  }),
});
