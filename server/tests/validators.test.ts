import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '../src/validators/auth.validator';
import { createTaskSchema, updateTaskSchema, taskIdSchema, taskQuerySchema } from '../src/validators/task.validator';
import { createCommentSchema } from '../src/validators/comment.validator';

describe('Auth validators', () => {
  it('accepts a valid signup payload', () => {
    const result = signupSchema.safeParse({
      body: { email: 'test@example.com', name: 'Test User', password: 'secret123' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({
      body: { email: 'not-an-email', name: 'Test', password: 'secret123' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = signupSchema.safeParse({
      body: { email: 'test@example.com', name: 'Test', password: '123' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({
      body: { email: 'test@example.com', password: 'secret123' },
    });
    expect(result.success).toBe(true);
  });
});

describe('Task validators', () => {
  it('accepts a valid create payload', () => {
    const result = createTaskSchema.safeParse({
      body: {
        title: 'New Task',
        priority: 'HIGH',
        status: 'TODO',
        assigneeIds: ['2e0a50d4-4b1e-4b6b-9e1d-30c61f7e9a38'],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = createTaskSchema.safeParse({ body: {} });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid priority value', () => {
    const result = createTaskSchema.safeParse({ body: { title: 'X', priority: 'UNKNOWN' } });
    expect(result.success).toBe(false);
  });

  it('rejects a non-uuid assignee id', () => {
    const result = createTaskSchema.safeParse({ body: { title: 'X', assigneeIds: ['not-a-uuid'] } });
    expect(result.success).toBe(false);
  });

  it('accepts a valid task id param', () => {
    const result = taskIdSchema.safeParse({ params: { id: '2e0a50d4-4b1e-4b6b-9e1d-30c61f7e9a38' } });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid task id', () => {
    const result = taskIdSchema.safeParse({ params: { id: '123' } });
    expect(result.success).toBe(false);
  });

  it('parses query defaults', () => {
    const result = taskQuerySchema.safeParse({ query: {} });
    expect(result.success).toBe(true);
    expect(result.data!.query.page).toBe('1');
    expect(result.data!.query.limit).toBe('20');
  });
});

describe('Comment validators', () => {
  it('accepts a valid comment', () => {
    const result = createCommentSchema.safeParse({
      body: { content: 'Hello' },
      params: { id: '2e0a50d4-4b1e-4b6b-9e1d-30c61f7e9a38' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty comment', () => {
    const result = createCommentSchema.safeParse({
      body: { content: '' },
      params: { id: '2e0a50d4-4b1e-4b6b-9e1d-30c61f7e9a38' },
    });
    expect(result.success).toBe(false);
  });
});