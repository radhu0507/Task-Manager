import { Response } from 'express';

export function sendSuccess(res: Response, data: unknown, message?: string, statusCode = 200) {
  const body: Record<string, unknown> = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, code: string, message: string, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}
