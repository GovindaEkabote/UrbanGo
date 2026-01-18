const express = require("express");
var cookieParser = require('cookie-parser')
const path = require("path");
const roleRoutes = require("./router/roleRoutes")
const permissionRoutes = require("./router/permissionRoutes")
const adminRoutes = require("./router/adminRouter")
const globalErrorHandler = require("./middleware/globalErrorHandler");
const securityMiddleware = require("./config/security");
const rateLimitMiddleware = require("./config/rate-limiter");
const app = express();


app.use(securityMiddleware.cors);
app.use(securityMiddleware.helmet);

app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../", "public")));
// Apply general rate limiting to all routes
app.use(rateLimitMiddleware.general);

// Router
app.use("/api/v1/health", require("./router/healthRoutes"));
app.use("/api/v1", require("./router/apiRouter"));
app.use('/api/v1', require('./router/auth'))


app.use("/api/v1/role",roleRoutes )
app.use("/api/v1/permission",permissionRoutes )
app.use("/api/v1/admin",adminRoutes )

// 404 handler for unmatched routes
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Global error handler (must be last)
app.use(globalErrorHandler);

module.exports = app;
