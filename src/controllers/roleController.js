const  roleService = require("../service/roleService");

class RoleController {
  async create(req, res) {
    try {
      // Debug: Check what's in the request
      console.log("Request headers:", req.headers);
      console.log("Request body:", req.body);
      console.log("req.admin:", req.admin);
      console.log("req.user:", req.user);

      // TEMPORARY FIX: For testing, use a default admin ID
      // Get an actual admin ID from your database
      const adminId = req.admin?._id || "65d4a1b2c8e9f01234567899"; // Replace with real ID
      
      console.log("Using admin ID:", adminId);

      const role = await roleService.createRole(req.body, adminId);
      
      res.status(201).json({
        success: true,
        message: "Role Created Successfully",
        data: role,
      });
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message,
        data: null,
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
}

module.exports = new RoleController();