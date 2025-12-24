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