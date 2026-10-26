import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): any => {
  console.error('[Error Handler]:', err);

  // Zod Validation Errors
  if (err instanceof ZodError) {
    const issues = (err as any).errors || (err as any).issues || [];
    const formattedErrors = issues.map((e: any) => ({
      path: e.path ? e.path.join('.') : 'field',
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 422, formattedErrors);
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File too large. Maximum allowed size is 5MB.', 400);
    }
    return sendError(res, err.message, 400);
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, `Invalid ID format for ${err.path}: ${err.value}`, 400);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return sendError(res, `Duplicate entry for ${field}: ${err.keyValue[field]}`, 409);
  }

  // Generic Application Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return sendError(res, message, statusCode);
};
