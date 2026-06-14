import type { Request, Response, NextFunction } from 'express';

/**
 * Validates the shared secret sent by the Channel microservice in delivery
 * callbacks. Protects the /callbacks endpoint from unauthorized callers.
 */
export function validateSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = req.headers['x-service-secret'];
  const expected = process.env.CHANNEL_SERVICE_SECRET;

  if (!expected) {
    // If no secret is configured, skip validation (useful in dev).
    console.warn('[validateSecret] CHANNEL_SERVICE_SECRET is not set — skipping validation.');
    next();
    return;
  }

  if (!secret || secret !== expected) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  next();
}

