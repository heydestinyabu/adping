import type { Request, Response, NextFunction } from 'express';
import {
  DiployError,
  asyncHandler as diployAsyncHandler,
  diployLogger,
  DIPLOY_HEADER_KEY,
  DIPLOY_HEADER_VALUE,
} from "@diploy/core";

export const AppError = DiployError;

export function errorHandler(
  err: Error | DiployError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader(DIPLOY_HEADER_KEY, DIPLOY_HEADER_VALUE);

  if (err instanceof DiployError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.code && { code: err.code }),
    });
  }

  diployLogger.error('Unexpected error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}

export const asyncHandler = diployAsyncHandler;
