import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode: number;
  code: string;
}

export function createError(statusCode: number, code: string, message: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export function errorHandler(err: AppError | Error, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || 'INTERNAL_ERROR';
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode === 500) {
    console.error('Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}
