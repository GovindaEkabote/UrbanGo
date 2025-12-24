const consfig = require("../config/config");

// middleware/bootstrap.middleware.js
module.exports = function bootstrapGuard(req, res, next) {
  if (consfig.BOOTSTRAP_MODE === "true") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Bootstrap mode disabled",
  });
};
