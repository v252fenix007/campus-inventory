import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: any;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = 'Operation successful',
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const sendError = (
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = 400,
  errors?: any
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
