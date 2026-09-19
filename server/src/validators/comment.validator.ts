import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(5000),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(5000),
  }),
  params: z.object({
    commentId: z.string().uuid(),
  }),
});

export const commentIdSchema = z.object({
  params: z.object({
    commentId: z.string().uuid(),
  }),
});
