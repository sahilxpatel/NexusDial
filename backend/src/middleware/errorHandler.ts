import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  logger.error({ event: 'UNHANDLED_ERROR', code: err.code, message: err.message });
  
  res.status(err.statusCode ?? 500).json({
    success: false,
    error: { 
      code: err.code ?? 'ND_5000', 
      message: err.message ?? 'Internal server error' 
    },
  });
};
