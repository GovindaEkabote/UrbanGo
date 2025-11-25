const express = require("express");
const path = require("path");
const globalErrorHandler = require("./middleware/globalErrorHandler");
const securityMiddleware = require("./config/security");
const rateLimitMiddleware = require("./config/rate-limiter");
const app = express();


app.use(securityMiddleware.cors);
app.use(securityMiddleware.helmet);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../", "public")));
// Apply general rate limiting to all routes
app.use(rateLimitMiddleware.general);

// Router
app.use("/api/v1/health", require("./router/healthRoutes"));
app.use("/api/v1", require("./router/apiRouter"));
app.use('/api/v1', require('./router/auth'))

// 404 handler for unmatched routes
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Global error handler (must be last)
app.use(globalErrorHandler);

module.exports = app;
