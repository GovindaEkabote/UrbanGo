const helmet = require("helmet");
const cors = require("cors");
const config = require("./config");
// CORS configuration
const corsOptions = {
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours for preflight cache
};

// Environment-based origin configuration
if (config.ENV === "production") {
  corsOptions.origin = ["https://urbango.com", "https://www.urbango.com"];
} else {
  corsOptions.origin = true; // Allow all origins in development
}

// Helmet configuration
const helmetConfig = {
  // Additional security headers
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Let other origins load your resources
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Restrict everything to your domain by default
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline JS
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline CSS
      imgSrc: ["'self'", "data:", "https:"], // Allow images from yourself, CDNs, and data URLs
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
    // Additional security headers
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
};

// Security middleware
const securityMiddleware = {
  helmet: helmet(helmetConfig),
  cors: cors(corsOptions),
};

module.exports = securityMiddleware;
