/**
 * Rate Limiting Middleware
 */
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(k => {
    if (store[k].resetTime < now) {
      delete store[k];
    }
  });
}, 5 * 60 * 1000);

/**
 * Simple in-memory rate limiter
 * For production, use a proper rate limiting library like express-rate-limit with Redis
 */
export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }
    
    store[key].count++;
    
    if (store[key].count > options.max) {
      return res.status(429).json({
        message: options.message || 'Too many requests, please try again later.',
      });
    }
    
    next();
  };
}

// Pre-configured rate limiters
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
});
