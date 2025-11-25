const express = require("express");
const rateLimitMiddleware = require("../config/rate-limiter");
const router = express.Router();

// Public routes - more generous limits
router.get("/public/data", rateLimitMiddleware.public, (req, res) => {
  res.json({ message: "Public data" });
});

// Authentication routes - stricter limits
router.post("/auth/login", rateLimitMiddleware.auth, (req, res) => {
  // Login logic
  res.json({ message: "Login endpoint" });
});

router.post("/auth/register", rateLimitMiddleware.auth, (req, res) => {
  // Registration logic
  res.json({ message: "Register endpoint" });
});

// Sensitive operations - very strict limits
router.post("/auth/password-reset", rateLimitMiddleware.sensitive, (req, res) => {
  // Password reset logic
  res.json({ message: "Password reset endpoint" });
});

// General API routes (use general rate limiting from app.js)
router.get("/users", (req, res) => {
  res.json({ message: "Users endpoint" });
});

module.exports = router;