const { RateLimiterMemory } = require("rate-limiter-flexible");
const config = require('./config');

// Helper function to get client IP (handles proxies)
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// Rate limiter configurations with environment-based limits
const getRateLimitConfig = () => {
  const baseConfig = {
    // General API limits for all routes
    general: {
      keyGenerator: (req) => getClientIP(req),
      points: config.ENV === 'production' ? 100 : 1000, // More lenient in development
      duration: 900, // 15 minutes
      blockDuration: 1800, // Block for 30 minutes if exceeded
    },
    
    // Stricter limits for authentication
    auth: {
      keyGenerator: (req) => getClientIP(req),
      points: 5, // 5 login attempts
      duration: 900, // 15 minutes
      blockDuration: 3600, // Block for 1 hour after exceeding
    },
    
    // Very strict for sensitive operations
    sensitive: {
      keyGenerator: (req) => getClientIP(req),
      points: 10, // 10 requests
      duration: 60, // 1 minute
      blockDuration: 300, // Block for 5 minutes
    },
    
    // Public endpoints (more generous limits)
    public: {
      keyGenerator: (req) => getClientIP(req),
      points: config.ENV === 'production' ? 200 : 2000, // More lenient in development
      duration: 900, // 15 minutes
    }
  };

  return baseConfig;
};

// Create rate limiters
const createRateLimiters = () => {
  const config = getRateLimitConfig();
  return {
    general: new RateLimiterMemory(config.general),
    auth: new RateLimiterMemory(config.auth),
    sensitive: new RateLimiterMemory(config.sensitive),
    public: new RateLimiterMemory(config.public)
  };
};

const rateLimiters = createRateLimiters();

// Rate limiting middleware functions
const rateLimitMiddleware = {
  // General rate limiting
  general: async (req, res, next) => {
    try {
      await rateLimiters.general.consume(getClientIP(req));
      next();
    } catch (rejRes) {
      return res.status(429).json({
        success: false,
        error: "Too Many Requests",
        message: "Please slow down your requests.",
        retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
      });
    }
  },

  // Authentication rate limiting
  auth: async (req, res, next) => {
    try {
      await rateLimiters.auth.consume(getClientIP(req));
      next();
    } catch (rejRes) {
      return res.status(429).json({
        success: false,
        error: "Too Many Authentication Attempts",
        message: "Please try again later.",
        retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
      });
    }
  },

  // Sensitive operations rate limiting
  sensitive: async (req, res, next) => {
    try {
      await rateLimiters.sensitive.consume(getClientIP(req));
      next();
    } catch (rejRes) {
      return res.status(429).json({
        success: false,
        error: "Too Many Requests",
        message: "Please wait before trying again.",
        retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
      });
    }
  },

  // Public endpoints rate limiting
  public: async (req, res, next) => {
    try {
      await rateLimiters.public.consume(getClientIP(req));
      next();
    } catch (rejRes) {
      return res.status(429).json({
        success: false,
        error: "Too Many Requests",
        message: "Please slow down your requests.",
        retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
      });
    }
  }
};

module.exports = rateLimitMiddleware;