/**
 * Comprehensive security middleware for Ultra Black API
 * Implements multiple layers of security best practices
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { validationResult } = require('express-validator');

// Rate limiting configurations for different endpoints
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General API rate limiter
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for auth endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later.'
);

// Rate limiter for form submissions
const formLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // limit each IP to 10 submissions per hour
  'Too many form submissions, please try again later.'
);

// Helmet configuration for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Custom security headers
const customSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Remove any keys with $ or . to prevent NoSQL injection
  mongoSanitize()(req, res, () => {
    // Additional sanitization for common attack vectors
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Remove potential script tags
          req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          // Trim whitespace
          req.body[key] = req.body[key].trim();
        }
      });
    }
    next();
  });
};

// API key validation for admin endpoints
const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }
  
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key'
    });
  }
  
  next();
};

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    referer: req.get('referer')
  };
  
  // Log suspicious activities
  if (req.path.includes('admin') || req.method === 'DELETE') {
    console.log('[SECURITY]', JSON.stringify(log));
  }
  
  next();
};

module.exports = {
  // Middleware collections
  basicSecurity: [
    helmetConfig,
    customSecurityHeaders,
    sanitizeRequest,
    securityLogger
  ],
  
  // Rate limiters
  generalLimiter,
  authLimiter,
  formLimiter,
  
  // Individual middleware
  helmet: helmetConfig,
  sanitize: sanitizeRequest,
  validateApiKey,
  handleValidationErrors,
  
  // Utility functions
  createRateLimiter
};