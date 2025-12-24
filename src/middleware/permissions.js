// middleware/permissions.js
const Role = require("../models/role.model");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // authAdmin must attach admin to req
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Load role + permissions only once per request
      if (!admin._permissions) {
        const role = await Role.findById(admin.roleId)
          .populate({
            path: "permissions",
            match: { isDeleted: false, isActive: true },
            select: "key isSystemPermission",
          })
          .select("permissions isSystemRole isActive")
          .lean();

        if (!role || !role.isActive) {
          return res.status(403).json({
            success: false,
            message: "Role is inactive or not found",
          });
        }

        admin._permissions = role.permissions.map((p) => p.key);
        admin._isSystemRole = role.isSystemRole;
      }

      // 🔥 SUPER_ADMIN or system role bypass
      if (admin._isSystemRole) {
        return next();
      }

      // Check permission
      if (!admin._permissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          required: requiredPermission,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = checkPermission;
