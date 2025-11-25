const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const globalErrorHandler = require("./middleware/globalErrorHandler");
const app = express();


// Enhanced Helmet configuration
app.use(
  helmet({
    // Additional security headers
    crossOriginResourcePolicy: { policy: "cross-origin" },  // Let other origins load your resources
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],   // Restrict everything to your domain by default
        scriptSrc: ["'self'", "'unsafe-inline'"],   // Allow inline JS
        styleSrc: ["'self'", "'unsafe-inline'"],    // Allow inline CSS
        imgSrc: ["'self'", "data:", "https:"],      // Allow images from yourself, CDNs, and data URLs
      },
    },
  })
);

// Enhanced CORS configuration
const corsOptions = {
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
};

// Environment-based origin configuration
if (process.env.NODE_ENV === "production") {
  corsOptions.origin = [
    "https://urbango.com",
    "https://www.urbango.com" // Include www subdomain
  ];
} else {
  corsOptions.origin = true; // Allow all origins in development
}

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../", "public")));

// Router
app.use("/api/v1/health", require("./router/healthRoutes"));
app.use("/api/v1", require("./router/apiRouter"));

// 404 handler for unmatched routes
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Global error handler (must be last)
app.use(globalErrorHandler);

module.exports = app;
