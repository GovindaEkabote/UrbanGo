const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const Role = require("../models/role.model");
const config = require("../config/config");
/**
 * Authentication middleware for Admin users
 * Verifies JWT token and attaches admin object to request
 */
const authAdmin = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
        code: "NO_TOKEN"
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // 2. Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please login again.",
          code: "TOKEN_EXPIRED"
        });
      }
      
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token. Please login again.",
          code: "INVALID_TOKEN"
        });
      }
      
      throw jwtError;
    }

    // 3. Find admin by ID from token
    const admin = await Admin.findOne({
      _id: decoded.id,
      isDeleted: false,
    })
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
      .lean();

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Account not found or has been deleted.",
        code: "ACCOUNT_NOT_FOUND"
      });
    }

    // 4. Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
        code: "ACCOUNT_DEACTIVATED"
      });
    }

    // 5. Get admin's role with permissions
    let roleWithPermissions = null;
    if (admin.role) {
      roleWithPermissions = await Role.findOne({
        _id: admin.role,
        isDeleted: false,
        isActive: true,
      })
        .populate("permissions", "permissionCode name description module")
        .select("roleName displayName level isSystemRole permissions")
        .lean();
    }

    // 6. Attach admin and role info to request
    req.admin = {
      ...admin,
      permissions: roleWithPermissions?.permissions || [],
      roleInfo: roleWithPermissions ? {
        roleId: roleWithPermissions._id,
        roleName: roleWithPermissions.roleName,
        displayName: roleWithPermissions.displayName,
        level: roleWithPermissions.level,
        isSystemRole: roleWithPermissions.isSystemRole,
      } : null,
    };

    req.token = token;

    // 7. Add last activity timestamp (optional - for tracking)
    await Admin.findByIdAndUpdate(
      admin._id,
      { lastActiveAt: new Date() },
      { new: true }
    );

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    // Handle specific database errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        code: "INVALID_ID_FORMAT"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
      code: "AUTH_FAILED"
    });
  }
};

/**
 * Optional: Admin only middleware (for super admin routes)
 * Ensures admin has system role or specific level
 */
exports.adminOnly = (requiredLevel = 1) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.admin.roleInfo) {
      return res.status(403).json({
        success: false,
        message: "No role assigned. Access denied.",
      });
    }

    // Check if system role
    if (req.admin.roleInfo.isSystemRole) {
      return next();
    }

    // Check role level
    if (req.admin.roleInfo.level < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role level ${requiredLevel} or higher.`,
        currentLevel: req.admin.roleInfo.level,
        requiredLevel,
      });
    }

    next();
  };
};

/**
 * Optional: Check if token is valid without requiring authentication
 * Useful for optional auth routes
 */
exports.optionalAuthAdmin = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // No token, continue without auth
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const admin = await Admin.findOne({
      _id: decoded.id,
      isDeleted: false,
      isActive: true,
    })
      .select("_id name email username role isActive")
      .lean();

    if (admin) {
      req.admin = admin;
      req.token = token;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without auth
    next();
  }
};

module.exports = authAdmin;