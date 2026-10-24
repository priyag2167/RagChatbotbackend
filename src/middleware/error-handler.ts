import { Request, Response, NextFunction } from 'express';
import { nodeEnv } from '../config/env';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found.' });
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Request failed:', nodeEnv === 'production' ? 'internal error' : error.message);
  res.status(500).json({ error: 'Unexpected server error. Please try again.' });
}
