import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate the shared secret in the X-Service-Secret header.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-service-secret'];
  const expectedSecret = process.env.SECRET;

  if (!expectedSecret) {
    console.warn('[auth] SECRET env variable is not set. Allowing all requests in development.');
    next();
    return;
  }

  if (!secret || secret !== expectedSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
