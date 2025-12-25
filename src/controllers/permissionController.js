const PermissionService = require("../service/permissionService");

// ✅ Create an instance of the service class
const permissionService = new PermissionService();

exports.createPermission = async (req, res, next) => {
  try {
    const adminId = req.admin?._id || null;

    // ✅ Call the method on the instance
    const permission = await permissionService.createPermission(
      req.body,
      adminId
    );

    res.status(201).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.log("Error in createPermission controller");
    next(error);
  }
};

exports.createBulkPermission = async (req, res, next) => {
  try {
    const permissions = req.body.permissions;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Permissions array is required",
      });
    }

    const result = await permissionService.createBulkPermission(
      permissions,
      req.admin?._id || null
    );

    res.status(201).json({
      success: true,
      message: "Permissions processed successfully",
      data: result,
    });
  } catch (error) {
    console.log("Error in createBulkPermission controller");
    next(error)
  }
};
